const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');
const { redisClient } = require('../config/redis');
const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

// @desc    Submit code for evaluation
// @route   POST /api/submissions
exports.submitCode = async (req, res) => {
  const { problemId, code, language } = req.body;
  const userId = req.user.id;

  try {
    // 1. Verify problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // 2. Validate code size (Max 50KB)
    const codeSizeInBytes = Buffer.byteLength(code, 'utf8');
    if (codeSizeInBytes > 50000) {
      return res.status(400).json({ message: 'Code size exceeds limit of 50KB' });
    }

    // 3. Increment problem attempts count
    await Problem.findByIdAndUpdate(problemId, { $inc: { attemptsCount: 1 } });

    // 4. Create submission with Pending status
    const submission = new Submission({
      userId,
      problemId,
      code,
      language,
      verdict: 'Pending',
      isRunOnly: false,
    });

    await submission.save();

    // 5. Queue submission ID to Redis
    await redisClient.rpush('submission_queue', submission._id.toString());
    console.log(`Queued submission ${submission._id} to Redis`);

    res.status(201).json(submission);
  } catch (err) {
    console.error('Submit code error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const TEMP_BASE_DIR = path.resolve(__dirname, '../../temp_submissions');
if (!fs.existsSync(TEMP_BASE_DIR)) {
  fs.mkdirSync(TEMP_BASE_DIR, { recursive: true });
}

const cleanOutput = (str) => {
  if (!str) return '';
  return str.toString().replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
};

function executeCodeInSandbox(code, language, inputData) {
  const runId = 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const tempDir = path.join(TEMP_BASE_DIR, runId);
  const outDir = path.join(tempDir, 'out');
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  const hostDirForMount = tempDir.replace(/\\/g, '/');
  const hostOutDirForMount = outDir.replace(/\\/g, '/');

  let compileSuccess = true;
  let compileErrorMsg = '';

  let filename = '';
  if (language === 'C++') filename = 'solution.cpp';
  else if (language === 'Java') filename = 'Main.java';
  else if (language === 'Python') filename = 'solution.py';

  fs.writeFileSync(path.join(tempDir, filename), code);

  // Compile if needed
  if (language === 'C++') {
    try {
      execSync(`docker run --rm -v ${hostDirForMount}:/code:ro -v ${hostOutDirForMount}:/out gcc:12 g++ -O3 /code/solution.cpp -o /out/solution`, { stdio: 'pipe' });
    } catch (err) {
      compileSuccess = false;
      compileErrorMsg = err.stderr ? err.stderr.toString() : err.message;
    }
  } else if (language === 'Java') {
    try {
      execSync(`docker run --rm -v ${hostDirForMount}:/code:ro -v ${hostOutDirForMount}:/out eclipse-temurin:11-jdk-alpine javac -d /out /code/Main.java`, { stdio: 'pipe' });
    } catch (err) {
      compileSuccess = false;
      compileErrorMsg = err.stderr ? err.stderr.toString() : err.message;
    }
  }

  if (!compileSuccess) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
    return {
      verdict: 'Compilation Error',
      stderr: compileErrorMsg,
      stdout: '',
      executionTime: 0,
    };
  }

  // Run code against input
  let dockerArgs = [];
  const containerName = `run_${runId}`;

  if (language === 'C++') {
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
  } else if (language === 'Java') {
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
  } else if (language === 'Python') {
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

  const startTime = Date.now();
  const runResult = spawnSync('docker', dockerArgs, {
    input: inputData || '',
    timeout: 5000, // 5s timeout
    encoding: 'utf8'
  });
  const executionTime = Date.now() - startTime;

  let verdict = 'Accepted';
  let stderr = runResult.stderr || '';
  let stdout = runResult.stdout || '';

  if (runResult.error && runResult.error.code === 'ETIMEDOUT') {
    verdict = 'Time Limit Exceeded';
    try {
      execSync(`docker kill ${containerName}`, { stdio: 'ignore' });
    } catch (e) {}
  } else if (runResult.status !== 0) {
    verdict = 'Runtime Error';
  }

  // Clean up
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}

  return {
    verdict,
    stdout,
    stderr,
    executionTime
  };
}

// @desc    Run code for quick verification (against sample test cases or custom input)
// @route   POST /api/submissions/run
exports.runCode = async (req, res) => {
  const { problemId, code, language, customInput } = req.body;

  try {
    // 1. Verify problem exists if problemId is provided
    if (problemId) {
      const problem = await Problem.findById(problemId);
      if (!problem) {
        return res.status(404).json({ message: 'Problem not found' });
      }
    }

    // 2. Validate code size (Max 50KB)
    const codeSizeInBytes = Buffer.byteLength(code, 'utf8');
    if (codeSizeInBytes > 50000) {
      return res.status(400).json({ message: 'Code size exceeds limit of 50KB' });
    }

    let finalVerdict = 'Accepted';
    let runOutputs = [];
    let totalTime = 0;

    if (customInput !== null && customInput !== undefined) {
      // Execute against custom input
      const runRes = executeCodeInSandbox(code, language, customInput);
      totalTime = runRes.executionTime;
      finalVerdict = runRes.verdict;
      runOutputs.push({
        input: customInput,
        expected: '',
        output: runRes.stdout,
        stderr: runRes.stderr,
        verdict: runRes.verdict
      });
    } else if (problemId) {
      // Execute against 3 sample test cases
      const testCases = await TestCase.find({ problemId, isHidden: false }).limit(3);
      for (const tc of testCases) {
        const runRes = executeCodeInSandbox(code, language, tc.input);
        totalTime = Math.max(totalTime, runRes.executionTime);
        
        let caseVerdict = runRes.verdict;
        if (caseVerdict === 'Accepted' && cleanOutput(runRes.stdout) !== cleanOutput(tc.expectedOutput)) {
          caseVerdict = 'Wrong Answer';
        }
        
        if (caseVerdict !== 'Accepted' && finalVerdict === 'Accepted') {
          finalVerdict = caseVerdict; // capture first failing verdict
        }

        runOutputs.push({
          input: tc.input,
          expected: tc.expectedOutput,
          output: runRes.stdout,
          stderr: runRes.stderr,
          verdict: caseVerdict
        });
      }
    }

    // Return the execution result immediately without writing to database or queueing
    res.status(200).json({
      _id: 'run_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      problemId: problemId || null,
      code,
      language,
      verdict: finalVerdict,
      isRunOnly: true,
      runOutputs,
      executionTime: totalTime,
      memoryUsed: 25,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Run code error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get submissions list (filtered by problem/user, paginated)
// @route   GET /api/submissions
exports.getSubmissions = async (req, res) => {
  try {
    const { problemId, userId, page = 1, limit = 10 } = req.query;

    const query = { isRunOnly: false }; // Never show run-only submissions in standard history lists

    // Filter by problem if provided
    if (problemId) {
      query.problemId = problemId;
    }

    // Filter by user if provided
    if (userId) {
      query.userId = userId;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalSubmissions = await Submission.countDocuments(query);
    const submissions = await Submission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('problemId', 'title difficulty')
      .populate('userId', 'fullName email');

    const totalPages = Math.ceil(totalSubmissions / limitNum);

    res.json({
      submissions,
      currentPage: pageNum,
      totalPages,
      totalSubmissions,
    });
  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get submission by ID
// @route   GET /api/submissions/:id
exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('problemId', 'title statement difficulty timeLimit memoryLimit sampleInput sampleOutput constraints')
      .populate('userId', 'fullName email');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(submission);
  } catch (err) {
    console.error('Get submission details error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
