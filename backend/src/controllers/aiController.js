const https = require('https');
const Problem = require('../models/Problem');

const callGemini = (apiKey, model, prompt) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            return reject(new Error(json.error.message || `Error from Gemini model ${model}`));
          }
          if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
            resolve(json.candidates[0].content.parts[0].text);
          } else {
            reject(new Error(`Invalid response structure from Gemini model ${model}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    // 15-second request timeout to prevent gateway timeouts
    req.setTimeout(15000, () => {
      req.destroy(new Error(`Gemini API connection timed out after 15 seconds on model ${model}`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
};

const callGeminiWithFallback = async (apiKey, prompt) => {
  const models = [
    'gemini-3.5-pro',
    'gemini-3.5-flash'
  ];

  for (const model of models) {
    try {
      console.log(`[AI] Attempting call with model: ${model}...`);
      return await callGemini(apiKey, model, prompt);
    } catch (err) {
      console.warn(`[AI] Model ${model} failed: ${err.message}. Trying next fallback...`);
    }
  }

  throw new Error('All Gemini API models in the fallback pipeline failed. Please check your API key and network connection.');
};

exports.getCompletion = async (req, res) => {
  const { code, language, problemId } = req.body;
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

  if (!apiKey) {
    return res.status(400).json({ 
      message: 'Gemini API Key is missing. Please add GEMINI_API_KEY to the backend/.env file on your EC2 instance.' 
    });
  }

  try {
    const problem = problemId ? await Problem.findById(problemId) : null;
    const problemTitle = problem ? problem.title : 'Playground Code';
    const problemStatement = problem ? problem.statement : 'No specific problem context.';

    const prompt = `You are a solutions agent for a competitive programming judge platform. Given a problem statement, you produce the TWO best optimized solutions to that problem — not a review of user code.

Problem: "${problemTitle}"
Problem Statement:
"${problemStatement}"

Target Language: ${language}

YOUR OUTPUT MUST INCLUDE, FOR EACH OF THE TWO SOLUTIONS:

1. **Approach name** (e.g. "Two-pointer sweep", "DP with bitmask", "Binary search on answer")
2. **Intuition** — 2-4 sentences on why this approach works, in plain language before any code.
3. **Full, correct, compilable code** — clean, idiomatic, properly commented at non-obvious steps only.
4. **Complexity analysis** — time and space, with a one-line justification.
5. **Edge cases handled** — briefly list what the code correctly handles.

SELECTION CRITERIA for the two solutions:
- The two solutions must be meaningfully different approaches, not minor variations of the same idea.
- Prefer showing: (a) the most optimal solution achievable given constraints, and (b) either a strong alternative approach OR a clearly-labeled simpler/more intuitive approach — label which is "Most Optimal" vs "Most Intuitive."
- Do not include a naive/brute-force solution unless no better approach exists.

CLOSE WITH:
A short comparison section under a "## Which to Use" header (e.g. "Prefer the DP approach for large n; the greedy approach is easier to code correctly under contest time pressure and works within these constraints too").

CONSTRAINTS:
- Code must actually compile/run correctly — no pseudocode unless explicitly requested.
- Do not reference or assume knowledge of any user-submitted code.
- Keep intuition explanations tight.

OUTPUT FORMAT:
## Solution 1: [Approach Name] — [Most Optimal / Most Intuitive]
**Intuition:** ...
**Code:**
\`\`\`${language.toLowerCase()}
...
\`\`\`
**Complexity:** Time O(...), Space O(...)
**Edge cases handled:** ...

## Solution 2: [Approach Name] — [Most Optimal / Most Intuitive]
**Intuition:** ...
**Code:**
\`\`\`${language.toLowerCase()}
...
\`\`\`
**Complexity:** Time O(...), Space O(...)
**Edge cases handled:** ...

## Which to Use
...`;

    const completedCode = await callGeminiWithFallback(apiKey, prompt);
    res.status(200).json({ completedCode });
  } catch (err) {
    console.error('AI completion error:', err);
    res.status(500).json({ message: err.message || 'Failed to generate AI code completion.' });
  }
};

exports.getReview = async (req, res) => {
  const { code, language, problemId } = req.body;
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

  if (!apiKey) {
    return res.status(400).json({ 
      message: 'Gemini API Key is missing. Please add GEMINI_API_KEY to the backend/.env file on your EC2 instance.' 
    });
  }

  try {
    const problem = problemId ? await Problem.findById(problemId) : null;
    const problemTitle = problem ? problem.title : 'Playground Code';
    const problemStatement = problem ? problem.statement : 'No specific problem context.';

    const prompt = `You are a code review agent embedded in a competitive programming judge platform.
You review ONLY the code the user has written and submitted — you do not solve the problem yourself or provide a full alternative solution.

Problem: "${problemTitle}"
Problem Statement:
"${problemStatement}"

Language: ${language}
User's current code:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

YOUR REVIEW MUST COVER, IN THIS ORDER:

1. **Bugs / Correctness Issues**
   - Point out logical errors, off-by-one mistakes, incorrect edge-case handling (empty input, single element, duplicates, negative numbers, overflow, etc.)
   - If a verdict/failing testcase is provided, reason about why it likely fails — trace through the logic, don't guess.
   - Be specific: quote the exact line/snippet, not just "there's a bug somewhere."

2. **Fix Suggestions**
   - For each bug found, give a minimal, targeted fix — a small code snippet or diff-style suggestion, not a full rewrite.
   - Explain why the fix works in 1-2 sentences.

3. **Clean Code / Readability**
   - Flag: poor variable naming, dead code, magic numbers, deeply nested conditionals, missing input validation, inconsistent style.
   - Suggest concrete improvements.
   - Keep this section brief — 2-4 bullet points max, don't nitpick trivial style.

4. **Complexity & Optimization**
   - State the current time and space complexity of the user's approach.
   - If it's suboptimal for the given constraints, explain what's causing the inefficiency.
   - Suggest the optimization direction WITHOUT writing the full optimized solution — nudge, don't solve. One short illustrative snippet of the technique is fine.

CONSTRAINTS:
- Never rewrite the user's entire solution end-to-end.
- Never reveal problem-specific tricks the user hasn't already attempted, if doing so would trivially solve the problem for them — hint at the direction instead.
- If the code is already correct and reasonably optimal, say so plainly — don't invent issues to seem thorough.
- Keep total output concise: use short paragraphs and bullets, not walls of text.
- Tone: direct, constructive, peer-reviewer style.

OUTPUT FORMAT:
## Bugs Found
...
## Suggested Fixes
...
## Clean Code Notes
...
## Complexity & Optimization
Current: O(...) time, O(...) space
Suggestion: ...`;

    const reviewMarkdown = await callGeminiWithFallback(apiKey, prompt);
    res.status(200).json({ reviewMarkdown });
  } catch (err) {
    console.error('AI review error:', err);
    res.status(500).json({ message: err.message || 'Failed to generate AI code review.' });
  }
};
