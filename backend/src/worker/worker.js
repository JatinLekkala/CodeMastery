const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const fs = require('fs');
const { spawn, execSync } = require('child_process');
const mongoose = require('mongoose');
const { createRedisClient } = require('../config/redis');
const connectDB = require('../config/db');

// Import models
const User = require('../models/User');
const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');
const Submission = require('../models/Submission');

// Connect to Database
connectDB();

const redisClient = createRedisClient();
const queueClient = createRedisClient();

const handleRedisError = (err) => {
  console.error('[Worker] Critical Redis Connection Loss. Exiting for PM2 recovery:', err);
  process.exit(1);
};
redisClient.on('error', handleRedisError);
queueClient.on('error', handleRedisError);

const TEMP_BASE_DIR = path.resolve(__dirname, '../../temp_submissions');
if (!fs.existsSync(TEMP_BASE_DIR)) {
  fs.mkdirSync(TEMP_BASE_DIR, { recursive: true });
}

// Helper to clean up string outputs
const cleanOutput = (str) => {
  if (!str) return '';
  return str.toString().replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
};

// Spawn docker execution with timeout
const runContainer = (args, inputData, timeLimitMs, containerName) => {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let isTimeout = false;

    const child = spawn('docker', args);

    // Timeout mechanism
    const timeoutTimer = setTimeout(() => {
      isTimeout = true;
      try {
        console.log(`[Worker] Execution timed out. Killing container: ${containerName}`);
        // Terminate container forcefully on host
        execSync(`docker kill ${containerName}`, { stdio: 'ignore' });
      } catch (err) {
        // Container might have already exited
      }
      child.kill('SIGKILL');
    }, timeLimitMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timeoutTimer);
      
      // If container was killed due to memory limit, Docker exit code is 137
      let isOOM = (code === 137 && !isTimeout);

      resolve({
        code,
        stdout,
        stderr,
        isTimeout,
        isOOM,
      });
    });

    // Write input data to stdin
    try {
      if (inputData) {
        child.stdin.write(inputData);
      }
      child.stdin.end();
    } catch (err) {
      // Stream might be closed if container exited quickly
    }
  });
};

const evaluateSubmission = async (submissionId) => {
  console.log(`[Worker] Started processing submission: ${submissionId}`);
  
  let submission;
  let tempDir = '';

  try {
    submission = await Submission.findById(submissionId);
    if (!submission) {
      console.error(`[Worker] Submission ${submissionId} not found in database`);
      return;
    }

    const problem = submission.problemId ? await Problem.findById(submission.problemId) : null;
    if (submission.problemId && !problem) {
      console.error(`[Worker] Problem ${submission.problemId} not found`);
      submission.verdict = 'Runtime Error';
      await submission.save();
      return;
    }

    // Determine which test cases to retrieve
    let testCases;
    if (submission.isRunOnly) {
      if (submission.customInput !== null) {
        testCases = [{
          input: submission.customInput,
          expectedOutput: '',
          isHidden: false,
          isCustom: true
        }];
        console.log(`[Worker] Running against custom input for submission ${submissionId}`);
      } else {
        // Run only against first 3 visible (sample) test cases
        testCases = await TestCase.find({ problemId: submission.problemId, isHidden: false }).limit(3);
        console.log(`[Worker] Running against ${testCases.length} visible test cases for submission ${submissionId}`);
      }
    } else {
      // Standard submission: evaluate against ALL test cases
      testCases = await TestCase.find({ problemId: submission.problemId });
      console.log(`[Worker] Evaluating against ALL ${testCases.length} test cases for submission ${submissionId}`);
    }

    if (!testCases || testCases.length === 0) {
      console.error(`[Worker] No test cases found for problem ${submission.problemId}`);
      submission.verdict = 'Accepted'; // Default if no test cases are registered
      await submission.save();
      
      // Notify main server
      await redisClient.publish('submission_updates', JSON.stringify({
        userId: submission.userId,
        submissionId: submission._id,
        problemId: submission.problemId,
        verdict: 'Accepted',
        testCasesPassedCount: 0,
        executionTime: 0,
        memoryUsed: 0,
        isRunOnly: submission.isRunOnly,
        runOutputs: [],
      }));
      return;
    }

    // 1. Create temporary directory on host
    tempDir = path.join(TEMP_BASE_DIR, submissionId.toString());
    const outDir = path.join(tempDir, 'out');
    fs.mkdirSync(tempDir, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });

    // Format paths for Docker volume mounting (Windows compatibility)
    const hostDirForMount = tempDir.replace(/\\/g, '/');
    const hostOutDirForMount = outDir.replace(/\\/g, '/');

    // 2. Write source code file
    let sourceFilename = '';
    if (submission.language === 'C++') {
      sourceFilename = 'solution.cpp';
    } else if (submission.language === 'Java') {
      sourceFilename = 'Main.java';
    } else if (submission.language === 'Python') {
      sourceFilename = 'solution.py';
    }

    fs.writeFileSync(path.join(tempDir, sourceFilename), submission.code);

    // 3. Compile Step (C++ & Java)
    let compileSuccess = true;
    let compileErrorMsg = '';

    if (submission.language === 'C++') {
      console.log(`[Worker] Compiling C++ for submission ${submissionId}...`);
      const compileArgs = [
        'run', '--rm',
        '-v', `${hostDirForMount}:/code:ro`,
        '-v', `${hostOutDirForMount}:/out`,
        'gcc:12',
        'g++', '-O3', '/code/solution.cpp', '-o', '/out/solution'
      ];
      
      try {
        const result = execSync(`docker ${compileArgs.join(' ')}`, { stdio: 'pipe' });
      } catch (err) {
        compileSuccess = false;
        compileErrorMsg = err.stderr ? err.stderr.toString() : err.message;
      }
    } else if (submission.language === 'Java') {
      console.log(`[Worker] Compiling Java for submission ${submissionId}...`);
      const compileArgs = [
        'run', '--rm',
        '-v', `${hostDirForMount}:/code:ro`,
        '-v', `${hostOutDirForMount}:/out`,
        'eclipse-temurin:11-jdk-alpine',
        'javac', '-d', '/out', '/code/Main.java'
      ];

      try {
        const result = execSync(`docker ${compileArgs.join(' ')}`, { stdio: 'pipe' });
      } catch (err) {
        compileSuccess = false;
        compileErrorMsg = err.stderr ? err.stderr.toString() : err.message;
      }
    }

    if (!compileSuccess) {
      console.log(`[Worker] Compilation failed for submission ${submissionId}`);
      submission.verdict = 'Compilation Error';
      submission.executionTime = 0;
      submission.memoryUsed = 0;
      submission.testCasesPassedCount = 0;
      if (submission.isRunOnly) {
        submission.runOutputs = [{
          input: submission.customInput || 'Sample cases',
          expectedOutput: '',
          userOutput: '',
          verdict: 'Compilation Error',
          error: compileErrorMsg,
        }];
      }
      await submission.save();
      
      // Notify main server
      await redisClient.publish('submission_updates', JSON.stringify({
        userId: submission.userId,
        submissionId: submission._id,
        problemId: submission.problemId,
        verdict: 'Compilation Error',
        testCasesPassedCount: 0,
        executionTime: 0,
        memoryUsed: 0,
        compileError: compileErrorMsg.slice(0, 1000),
        isRunOnly: submission.isRunOnly,
        runOutputs: submission.runOutputs || [],
      }));

      return;
    }

    // 4. Execution Step (for each test case)
    console.log(`[Worker] Executing code against ${testCases.length} test cases...`);
    let passedCount = 0;
    let maxTimeMs = 0;
    let finalVerdict = 'Accepted';
    let baseMemoryUsed = submission.language === 'C++' ? 4 : submission.language === 'Python' ? 12 : 35; // default simulated baseline in MB
    const runOutputs = [];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const containerName = `codemastery_run_${submissionId}_tc_${i}`;
      let dockerArgs = [];

      if (submission.language === 'C++') {
        dockerArgs = [
          'run', '--rm', '-i',
          '--name', containerName,
          '--network', 'none',
          '-m', '256m',
          '--cpus', '1',
          '--read-only',
          '-v', `${hostOutDirForMount}:/out:ro`,
          'gcc:12',
          '/out/solution'
        ];
      } else if (submission.language === 'Java') {
        dockerArgs = [
          'run', '--rm', '-i',
          '--name', containerName,
          '--network', 'none',
          '-m', '256m',
          '--cpus', '1',
          '--read-only',
          '-v', `${hostOutDirForMount}:/out:ro`,
          'eclipse-temurin:11-jdk-alpine',
          'java', '-cp', '/out', 'Main'
        ];
      } else if (submission.language === 'Python') {
        dockerArgs = [
          'run', '--rm', '-i',
          '--name', containerName,
          '--network', 'none',
          '-m', '256m',
          '--cpus', '1',
          '--read-only',
          '-e', 'PYTHONDONTWRITEBYTECODE=1',
          '-v', `${hostDirForMount}:/code:ro`,
          'python:3.9-slim',
          'python', '/code/solution.py'
        ];
      }

      const startTime = process.hrtime();
      const timeLimitVal = problem ? problem.timeLimit : 5000;
      const executionResult = await runContainer(dockerArgs, tc.input, timeLimitVal + 6000, containerName);
      const diffTime = process.hrtime(startTime);
      const rawTime = Math.round((diffTime[0] * 1000) + (diffTime[1] / 1000000));
      const executionTimeMs = Math.max(2, rawTime - 1500);
      
      maxTimeMs = Math.max(maxTimeMs, executionTimeMs);

      let tcVerdict = 'Accepted';
      let tcError = '';
      const userStdout = cleanOutput(executionResult.stdout);
      const expectedStdout = cleanOutput(tc.expectedOutput);

      if (executionResult.isTimeout) {
        tcVerdict = 'TLE';
        tcError = 'Time Limit Exceeded';
        finalVerdict = 'TLE';
      } else if (executionResult.isOOM) {
        tcVerdict = 'Runtime Error';
        tcError = 'Out of Memory (OOM)';
        finalVerdict = 'Runtime Error';
      } else if (executionResult.code !== 0) {
        tcVerdict = 'Runtime Error';
        tcError = executionResult.stderr || 'Runtime Error';
        finalVerdict = 'Runtime Error';
      } else if (tc.isCustom) {
        tcVerdict = 'Success'; // custom runs don't match output constraints
      } else if (userStdout !== expectedStdout) {
        tcVerdict = 'Wrong Answer';
        finalVerdict = 'Wrong Answer';
      }

      if (tcVerdict === 'Accepted' || tcVerdict === 'Success') {
        passedCount++;
      }

      // Publish live progress update to Redis
      await redisClient.publish('submission_progress', JSON.stringify({
        userId: submission.userId.toString(),
        submissionId: submission._id.toString(),
        currentCaseIndex: i + 1,
        totalCasesCount: testCases.length,
        passedCount: passedCount,
        verdict: tcVerdict
      }));

      if (submission.isRunOnly || tcVerdict !== 'Accepted') {
        runOutputs.push({
          input: tc.input,
          expectedOutput: tc.isCustom ? 'N/A (Custom Input)' : tc.expectedOutput,
          userOutput: userStdout || tcError || '',
          verdict: tcVerdict,
          error: tcError,
        });
      }

      if (!submission.isRunOnly && tcVerdict !== 'Accepted') {
        // Standard submissions: stop immediately on first failing case to save host CPU
        break;
      }
    }

    // 5. Update submission
    submission.verdict = finalVerdict;
    submission.executionTime = maxTimeMs;
    submission.memoryUsed = baseMemoryUsed + Math.floor(Math.random() * 5); // simulated baseline + jitter
    submission.testCasesPassedCount = passedCount;
    submission.runOutputs = runOutputs;
    await submission.save();

    // 6. Update user statistics if NOT run-only
    let ratingDelta = 0;
    if (!submission.isRunOnly) {
      const userId = submission.userId;
      const problemId = submission.problemId;

      // Check if this is the user's first attempt at this problem
      const totalPriorSubmissions = await Submission.countDocuments({
        userId,
        problemId,
        isRunOnly: false,
        _id: { $ne: submission._id },
      });

      if (totalPriorSubmissions === 0) {
        await User.findByIdAndUpdate(userId, { $inc: { totalProblemsAttempted: 1 } });
      }

      if (finalVerdict === 'Accepted') {
        const lockKey = `lock:rating:${userId}:${problemId}`;
        let hasLock = false;
        try {
          // Acquire lock with 5-second TTL (NX = only if not exists, PX = milliseconds TTL)
          const reply = await redisClient.set(lockKey, '1', 'NX', 'PX', 5000);
          if (reply === 'OK') {
            hasLock = true;
            
            // Check if user has already solved this problem
            const priorAccepted = await Submission.countDocuments({
              userId,
              problemId,
              verdict: 'Accepted',
              isRunOnly: false,
              _id: { $ne: submission._id },
            });

            if (priorAccepted === 0) {
              // First time solving!
              ratingDelta = 10;
              await User.findByIdAndUpdate(userId, { $inc: { totalProblemsSolved: 1, rating: 10 } });
              await Problem.findByIdAndUpdate(problemId, { $inc: { solutionsCount: 1 } });
              console.log(`[Worker] User ${userId} solved ${problem.title} for the first time (+10 rating)`);
            }
          } else {
            console.log(`[Worker] Skip duplicate AC rating check for user ${userId} and problem ${problemId} due to active lock.`);
          }
        } catch (lockErr) {
          console.error('[Worker] Lock error during rating update:', lockErr);
        } finally {
          if (hasLock) {
            await redisClient.del(lockKey);
          }
        }
      } else {
        // Incorrect submission (WA, TLE, RE)
        ratingDelta = -1;
        await User.findByIdAndUpdate(userId, { $inc: { rating: -1 } });
        console.log(`[Worker] User ${userId} incorrect submission (-1 rating)`);
      }

      // 7. Clear leaderboard cache in Redis
      await redisClient.del('leaderboard_cache');
    }

    // 8. Publish socket update to Redis
    const updatePayload = {
      userId: submission.userId,
      submissionId: submission._id,
      problemId: submission.problemId,
      verdict: submission.verdict,
      testCasesPassedCount: submission.testCasesPassedCount,
      executionTime: submission.executionTime,
      memoryUsed: submission.memoryUsed,
      isRunOnly: submission.isRunOnly,
      runOutputs: submission.runOutputs || [],
      ratingDelta: ratingDelta,
    };

    await redisClient.publish('submission_updates', JSON.stringify(updatePayload));
    console.log(`[Worker] Evaluation complete. Verdict: ${finalVerdict}. Published to Redis.`);

  } catch (err) {
    console.error(`[Worker] Exception during evaluation of submission ${submissionId}:`, err);
    if (submission) {
      submission.verdict = 'Runtime Error';
      await submission.save();
    }
  } finally {
    // 9. Clean up temporary files on host
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`[Worker] Cleaned up temporary directory: ${tempDir}`);
      } catch (err) {
        console.error(`[Worker] Failed to delete temp directory: ${tempDir}`, err);
      }
    }
  }
};

// Main polling loop
const startWorker = async () => {
  console.log('[Worker] Queue worker listening for submissions on Redis...');
  
  while (true) {
    try {
      // Pop submission from queue (blocking pop using dedicated queueClient)
      const result = await queueClient.brpop('submission_queue', 0);
      if (result && result.length === 2) {
        const submissionId = result[1];
        await evaluateSubmission(submissionId);
      }
    } catch (err) {
      console.error('[Worker] Error in polling loop:', err);
      // Wait a moment before retrying if Redis disconnects
      await new Promise(r => setTimeout(r, 2000));
    }
  }
};

// Watchdog timer to automatically fail stale submissions (running or pending > 5 minutes)
setInterval(async () => {
  try {
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const staleSubmissions = await Submission.find({
      verdict: { $in: ['Pending', 'Processing'] },
      createdAt: { $lt: staleThreshold }
    });

    for (const sub of staleSubmissions) {
      console.warn(`[Watchdog] Found stale submission ${sub._id} in state '${sub.verdict}'. Marking as System Error.`);
      sub.verdict = 'System Error';
      sub.runOutputs = [{
        input: '',
        expected: '',
        output: '',
        stderr: 'System Error: Submission processing timed out or worker crashed.'
      }];
      await sub.save();
      
      // Publish real-time socket update
      await redisClient.publish('submission_updates', JSON.stringify({
        userId: sub.userId,
        submissionId: sub._id,
        problemId: sub.problemId,
        verdict: 'System Error',
        testCasesPassedCount: 0,
        executionTime: 0,
        memoryUsed: 0,
        isRunOnly: sub.isRunOnly,
        runOutputs: sub.runOutputs,
        ratingDelta: 0
      }));
    }
  } catch (err) {
    console.error('[Watchdog] Error running stale-job check:', err);
  }
}, 60 * 1000);

startWorker();
