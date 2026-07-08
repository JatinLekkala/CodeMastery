const https = require('https');
const Problem = require('../models/Problem');

const callGemini = (apiKey, prompt) => {
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
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
            return reject(new Error(json.error.message || 'Error from Gemini API'));
          }
          if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
            resolve(json.candidates[0].content.parts[0].text);
          } else {
            reject(new Error('Invalid response structure from Gemini API'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
};

exports.getCompletion = async (req, res) => {
  const { code, language, problemId } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ 
      message: 'Gemini API Key is missing. Please add GEMINI_API_KEY to the backend/.env file on your EC2 instance.' 
    });
  }

  try {
    const problem = problemId ? await Problem.findById(problemId) : null;
    const problemTitle = problem ? problem.title : 'Playground Code';
    const problemStatement = problem ? problem.statement : 'No specific problem context.';

    const prompt = `You are an expert competitive programming assistant.
The user is solving the problem: "${problemTitle}".
Here is the problem statement:
"${problemStatement}"

Language: ${language}
Here is the user's current code:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

Complete the code block so it fully solves the problem. Return ONLY the code inside a single markdown code block (e.g. \`\`\`cpp ... \`\`\`). Do not include any explanations, introduction, or warnings outside the code block.`;

    const rawResponse = await callGemini(apiKey, prompt);
    
    // Extract the code block from the response
    const codeBlockRegex = /```[\w+#]*([\s\S]*?)```/;
    const match = rawResponse.match(codeBlockRegex);
    let completedCode = match ? match[1].trim() : rawResponse.trim();

    res.status(200).json({ completedCode });
  } catch (err) {
    console.error('AI completion error:', err);
    res.status(500).json({ message: err.message || 'Failed to generate AI code completion.' });
  }
};

exports.getReview = async (req, res) => {
  const { code, language, problemId } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ 
      message: 'Gemini API Key is missing. Please add GEMINI_API_KEY to the backend/.env file on your EC2 instance.' 
    });
  }

  try {
    const problem = problemId ? await Problem.findById(problemId) : null;
    const problemTitle = problem ? problem.title : 'Playground Code';
    const problemStatement = problem ? problem.statement : 'No specific problem context.';

    const prompt = `You are a senior backend engineer and competitive programming coach.
The user is solving the problem: "${problemTitle}".
Here is the problem statement:
"${problemStatement}"

Language: ${language}
Here is the user's code:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

Provide a professional code audit. Your output must be in Markdown format, containing:
1. **Complexity Analysis**: Time and Space complexity.
2. **Key Recommendations**: 2-3 specific suggestions to improve performance, readability, or handle corner cases (e.g. integer overflow, empty arrays, large inputs).
3. **Optimized Solution Suggestion**: Recommend an optimized snippet if there is a cleaner or faster approach.
Be brief, constructive, and avoid generic boilerplate advice.`;

    const reviewMarkdown = await callGemini(apiKey, prompt);
    res.status(200).json({ reviewMarkdown });
  } catch (err) {
    console.error('AI review error:', err);
    res.status(500).json({ message: err.message || 'Failed to generate AI code review.' });
  }
};
