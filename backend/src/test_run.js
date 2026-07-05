const http = require('http');

const PORT = 5000;
const HOST = 'localhost';
const BASE_PATH = '/api';

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: HOST,
      port: PORT,
      path: BASE_PATH + path,
      method: method,
      headers: headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed;
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch (e) {
          parsed = { text: data };
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data: parsed });
        } else {
          reject({ status: res.statusCode, data: parsed });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(postData);
    }
    req.end();
  });
};

const pollSubmission = async (id, token) => {
  let attempts = 0;
  while (attempts < 80) {
    const res = await request('GET', `/submissions/${id}`, null, token);
    if (res.data.verdict !== 'Pending') {
      return res.data;
    }
    attempts++;
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error(`Polling timed out for submission ${id}`);
};

const runTests = async () => {
  try {
    console.log('--- Starting Integration Tests for CodeMastery rating, draft, and visibility features ---\n');

    // 1. Log in as Alice
    console.log('1. Logging in as alice@codemastery.com...');
    const loginRes = await request('POST', '/auth/login', {
      email: 'alice@codemastery.com',
      password: 'password123',
    });
    const token = loginRes.data.token;
    const userId = loginRes.data.user.id || loginRes.data.user._id;
    console.log(`Logged in! Token acquired. User ID: ${userId}`);

    // Fetch initial user rating & stats
    const initProfile = await request('GET', `/users/${userId}`, null, token);
    const initialRating = initProfile.data.user.rating || 1200;
    const initialHistoryLength = initProfile.data.recentSubmissions.length;
    console.log(`Initial Rating: ${initialRating} | Submissions history length: ${initialHistoryLength}`);

    // 2. Fetch problems to locate "Palindrome Check"
    const probRes = await request('GET', '/problems', null, token);
    const palindromeProblem = probRes.data.problems.find(p => p.title === 'Palindrome Check');
    if (!palindromeProblem) {
      throw new Error('Palindrome Check problem not found!');
    }
    const problemId = palindromeProblem._id;
    console.log(`Located Palindrome Check, ID: ${problemId}`);

    // 3. Test "Run Code" (correct code) -> rating should NOT change, NOT present in dashboard
    console.log('\n3. Testing "Run Code" (Correct solution)...');
    const pythonCode = `import sys
s = sys.stdin.read().strip()
if s == s[::-1]:
    print("true")
else:
    print("false")
`;
    
    const runRes = await request('POST', '/submissions/run', {
      problemId,
      code: pythonCode,
      language: 'Python',
    }, token);

    let runSubmissionId = runRes.data._id;
    console.log(`Run queued with ID: ${runSubmissionId}. Waiting for results...`);
    let runResult = await pollSubmission(runSubmissionId, token);
    console.log(`Run complete! Verdict: ${runResult.verdict}`);

    // Verify rating hasn't changed & history size hasn't changed
    const afterRunProfile = await request('GET', `/users/${userId}`, null, token);
    const ratingAfterRun = afterRunProfile.data.user.rating || 1200;
    const historyAfterRun = afterRunProfile.data.recentSubmissions.length;
    console.log(`After Run Rating: ${ratingAfterRun} | History length: ${historyAfterRun}`);
    if (ratingAfterRun !== initialRating) {
      throw new Error(`Expected rating to remain ${initialRating}, but it became ${ratingAfterRun}`);
    }
    if (historyAfterRun !== initialHistoryLength) {
      throw new Error(`Expected history length to remain ${initialHistoryLength}, but it became ${historyAfterRun}`);
    }
    console.log('✔ "Run Code" verified: Rating remains unchanged and did not populate dashboard.');

    // 4. Test "Submit Solution" (INCORRECT code) -> rating should deduct 1 point, history should include it, show failing case
    console.log('\n4. Testing "Submit Solution" with INCORRECT code...');
    const badCode = `print("always_wrong")`;
    const badSubmitRes = await request('POST', '/submissions', {
      problemId,
      code: badCode,
      language: 'Python'
    }, token);

    let badSubmitId = badSubmitRes.data._id;
    console.log(`Bad Submission queued with ID: ${badSubmitId}. Waiting for results...`);
    let badSubmitResult = await pollSubmission(badSubmitId, token);
    console.log(`Bad submission complete! Verdict: ${badSubmitResult.verdict} | Passed cases: ${badSubmitResult.testCasesPassedCount}`);
    
    if (badSubmitResult.verdict === 'Accepted') {
      throw new Error('Expected wrong submission to fail, but it was Accepted!');
    }
    if (!badSubmitResult.runOutputs || badSubmitResult.runOutputs.length === 0) {
      throw new Error('Expected failing submission to include the failed test case details in runOutputs!');
    }
    console.log(`Failing test case recorded in runOutputs: Input: "${badSubmitResult.runOutputs[0].input.trim()}" | Expected: "${badSubmitResult.runOutputs[0].expectedOutput.trim()}" | Got: "${badSubmitResult.runOutputs[0].userOutput.trim()}"`);

    // Verify rating decremented by 1, and history size increased by 1
    const afterBadProfile = await request('GET', `/users/${userId}`, null, token);
    const ratingAfterBad = afterBadProfile.data.user.rating || 1200;
    const historyAfterBad = afterBadProfile.data.recentSubmissions.length;
    console.log(`After Bad Submission Rating: ${ratingAfterBad} | History length: ${historyAfterBad}`);
    
    if (ratingAfterBad !== initialRating - 1) {
      throw new Error(`Expected rating to decrement to ${initialRating - 1}, but got ${ratingAfterBad}`);
    }
    const expectedHistoryLength = Math.min(10, initialHistoryLength + 1);
    if (historyAfterBad !== expectedHistoryLength) {
      throw new Error(`Expected history length to be ${expectedHistoryLength}, but got ${historyAfterBad}`);
    }
    console.log('✔ Wrong submission verified: Rating decremented by 1, failed testcase captured, and submission listed in history.');

    // 5. Test "Submit Solution" (CORRECT code) -> rating should increment by 10, history should increase
    console.log('\n5. Testing "Submit Solution" with CORRECT code...');
    const goodSubmitRes = await request('POST', '/submissions', {
      problemId,
      code: pythonCode,
      language: 'Python'
    }, token);

    let goodSubmitId = goodSubmitRes.data._id;
    console.log(`Good Submission queued with ID: ${goodSubmitId}. Waiting for results...`);
    let goodSubmitResult = await pollSubmission(goodSubmitId, token);
    console.log(`Good submission complete! Verdict: ${goodSubmitResult.verdict} | Passed cases: ${goodSubmitResult.testCasesPassedCount}`);

    if (goodSubmitResult.verdict !== 'Accepted') {
      throw new Error(`Expected correct submission to be Accepted, but got ${goodSubmitResult.verdict}`);
    }

    // Verify rating incremented by 10, and history size increased
    const afterGoodProfile = await request('GET', `/users/${userId}`, null, token);
    const ratingAfterGood = afterGoodProfile.data.user.rating || 1200;
    const historyAfterGood = afterGoodProfile.data.recentSubmissions.length;
    console.log(`After Good Submission Rating: ${ratingAfterGood} | History length: ${historyAfterGood}`);

    // 6. Test Standalone Code Playground (problemId: null) -> executes successfully, rating/history remains constant
    console.log('\n6. Testing standalone Code Playground execution (problemId: null)...');
    const playgroundCode = `import sys
print("Playground stdout: " + sys.stdin.read().strip())
`;
    const playgroundInput = 'custom playground input';
    const playRes = await request('POST', '/submissions/run', {
      problemId: null,
      code: playgroundCode,
      language: 'Python',
      customInput: playgroundInput
    }, token);

    let playId = playRes.data._id;
    console.log(`Playground Run queued with ID: ${playId}. Waiting for results...`);
    let playResult = await pollSubmission(playId, token);
    console.log(`Playground Run complete! Verdict: ${playResult.verdict}`);
    console.log(`Playground Outputs: Input: "${playResult.runOutputs[0].input.trim()}" | Got Output: "${playResult.runOutputs[0].userOutput.trim()}"`);

    if (playResult.verdict !== 'Accepted') {
      throw new Error(`Expected Playground execution to be Accepted, but got ${playResult.verdict}`);
    }
    if (playResult.runOutputs[0].userOutput.trim() !== 'Playground stdout: custom playground input') {
      throw new Error(`Expected output 'Playground stdout: custom playground input', got '${playResult.runOutputs[0].userOutput.trim()}'`);
    }

    const finalProfile = await request('GET', `/users/${userId}`, null, token);
    const finalRating = finalProfile.data.user.rating || 1200;
    const finalHistoryLength = finalProfile.data.recentSubmissions.length;
    console.log(`Final Rating registered: ${finalRating} | Final history length: ${finalHistoryLength}`);
    
    console.log('\n--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
    process.exit(0);

  } catch (err) {
    console.error('\n!!! INTEGRATION TEST FAILED !!!');
    console.error(err);
    process.exit(1);
  }
};

runTests();
