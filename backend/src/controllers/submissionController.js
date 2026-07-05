const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const { redisClient } = require('../config/redis');

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

// @desc    Run code for quick verification (against sample test cases or custom input)
// @route   POST /api/submissions/run
exports.runCode = async (req, res) => {
  const { problemId, code, language, customInput } = req.body;
  const userId = req.user.id;

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

    // 3. Create run-only submission with Pending status
    const submission = new Submission({
      userId,
      problemId: problemId || null,
      code,
      language,
      verdict: 'Pending',
      isRunOnly: true,
      customInput: customInput !== undefined ? customInput : null,
    });

    await submission.save();

    // 4. Queue submission ID to Redis
    await redisClient.rpush('submission_queue', submission._id.toString());
    console.log(`Queued run-only submission ${submission._id} to Redis`);

    res.status(201).json(submission);
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
