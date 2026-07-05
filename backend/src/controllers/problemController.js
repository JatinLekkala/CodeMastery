const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');

// @desc    Get all problems with filtering, pagination and search
// @route   GET /api/problems
exports.getProblems = async (req, res) => {
  try {
    const { difficulty, tags, search, page = 1, limit = 10 } = req.query;

    const query = {};

    // Filter by difficulty
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Filter by tags
    if (tags) {
      // Tags can be a single tag string or an array of tag strings
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagsArray };
    }

    // Search query (matches title or statement)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { statement: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalProblems = await Problem.countDocuments(query);
    const problems = await Problem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalProblems / limitNum);

    res.json({
      problems,
      currentPage: pageNum,
      totalPages,
      totalProblems,
    });
  } catch (err) {
    console.error('Get problems error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get problem by ID
// @route   GET /api/problems/:id
exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (err) {
    console.error('Get problem details error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create problem (Admin only)
// @route   POST /api/problems
exports.createProblem = async (req, res) => {
  const {
    title,
    statement,
    difficulty,
    tags,
    timeLimit,
    memoryLimit,
    sampleInput,
    sampleOutput,
    constraints,
    testCases, // Array of test cases: [{ input, expectedOutput, isHidden }]
  } = req.body;

  try {
    const problem = new Problem({
      title,
      statement,
      difficulty,
      tags: tags || [],
      timeLimit: timeLimit || 5000,
      memoryLimit: memoryLimit || 256,
      sampleInput: sampleInput || '',
      sampleOutput: sampleOutput || '',
      constraints: constraints || '',
    });

    const savedProblem = await problem.save();

    // Create and save test cases if provided
    if (testCases && Array.isArray(testCases) && testCases.length > 0) {
      const testCasesData = testCases.map((tc) => ({
        problemId: savedProblem._id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden || false,
      }));
      await TestCase.insertMany(testCasesData);
    }

    res.status(201).json(savedProblem);
  } catch (err) {
    console.error('Create problem error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
