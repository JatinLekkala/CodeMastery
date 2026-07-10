const User = require('../models/User');
const Submission = require('../models/Submission');
const { redisClient } = require('../config/redis');

// @desc    Get top 50 users with caching in Redis (5-minute TTL)
// @route   GET /api/leaderboard
exports.getLeaderboard = async (req, res) => {
  const cacheKey = 'leaderboard_cache';
  
  try {
    // 1. Try to fetch from Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('Leaderboard fetched from Redis cache');
      return res.json(JSON.parse(cachedData));
    }

    // 2. Cache miss - query MongoDB
    console.log('Leaderboard cache miss - querying MongoDB');
    const defaultEmails = [
      'admin@codemastery.com',
      'alice@codemastery.com',
      'bob@codemastery.com',
      'charlie@codemastery.com',
      'dave@codemastery.com'
    ];

    const leaderboard = await User.find({ 
      role: { $ne: 'Admin' },
      email: { $nin: defaultEmails }
    })
      .sort({ totalProblemsSolved: -1, rating: -1 })
      .limit(50)
      .select('fullName email totalProblemsAttempted totalProblemsSolved rating createdAt');

    // 3. Save to Redis cache with 5-minute TTL (300 seconds)
    await redisClient.setex(cacheKey, 300, JSON.stringify(leaderboard));

    res.json(leaderboard);
  } catch (err) {
    console.error('Get leaderboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile and statistics
// @route   GET /api/users/:userId
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch user's recent submissions (only standard submissions)
    const recentSubmissions = await Submission.find({ userId: req.params.userId, isRunOnly: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('problemId', 'title difficulty');

    // Calculate language distribution and difficulty breakdown
    const allSubmissions = await Submission.find({ userId: req.params.userId, isRunOnly: false }).populate('problemId', 'difficulty');
    
    const difficultyStats = { Easy: { solved: 0, attempted: 0 }, Medium: { solved: 0, attempted: 0 }, Hard: { solved: 0, attempted: 0 } };
    const languageStats = { 'C++': 0, 'Java': 0, 'Python': 0 };

    const solvedProblems = new Set();
    const attemptedProblems = new Set();

    allSubmissions.forEach(sub => {
      const diff = sub.problemId ? sub.problemId.difficulty : null;
      const probId = sub.problemId ? sub.problemId._id.toString() : null;
      
      if (diff) {
        attemptedProblems.add(probId);
        if (sub.verdict === 'Accepted') {
          solvedProblems.add(probId);
        }
      }

      if (sub.language in languageStats) {
        languageStats[sub.language]++;
      }
    });

    // We can also query all submissions and group by problem difficulty to populate solved/attempted counts precisely
    // Let's populate the difficulty statistics by query
    const solvedSubmissionsList = await Submission.find({ userId: req.params.userId, verdict: 'Accepted', isRunOnly: false }).populate('problemId', 'difficulty');
    const attemptedSubmissionsList = await Submission.find({ userId: req.params.userId, isRunOnly: false }).populate('problemId', 'difficulty');

    const solvedSet = new Set();
    solvedSubmissionsList.forEach(s => { if (s.problemId) solvedSet.add(s.problemId._id.toString()); });

    const attemptedSet = new Set();
    attemptedSubmissionsList.forEach(s => { if (s.problemId) attemptedSet.add(s.problemId._id.toString()); });

    attemptedSubmissionsList.forEach(s => {
      if (s.problemId) {
        const diff = s.problemId.difficulty;
        if (diff in difficultyStats) {
          // If we haven't counted this problem's attempt yet
          if (attemptedSet.has(s.problemId._id.toString())) {
            // Count unique problems
          }
        }
      }
    });

    // Let's count unique problems per difficulty
    const uniqueSolved = {};
    solvedSubmissionsList.forEach(s => {
      if (s.problemId) {
        uniqueSolved[s.problemId._id.toString()] = s.problemId.difficulty;
      }
    });
    
    const uniqueAttempted = {};
    attemptedSubmissionsList.forEach(s => {
      if (s.problemId) {
        uniqueAttempted[s.problemId._id.toString()] = s.problemId.difficulty;
      }
    });

    Object.values(uniqueSolved).forEach(diff => {
      if (diff in difficultyStats) difficultyStats[diff].solved++;
    });

    Object.values(uniqueAttempted).forEach(diff => {
      if (diff in difficultyStats) difficultyStats[diff].attempted++;
    });

    res.json({
      user,
      recentSubmissions,
      stats: {
        difficultyStats,
        languageStats,
        uniqueSolvedCount: Object.keys(uniqueSolved).length,
        uniqueAttemptedCount: Object.keys(uniqueAttempted).length,
      }
    });
  } catch (err) {
    console.error('Get user profile error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
