const express = require('express');
const leaderboardController = require('../controllers/leaderboardController');

const router = express.Router();

// @route   GET /api/leaderboard
// @desc    Get top 50 users based on problems solved
router.get('/', leaderboardController.getLeaderboard);

module.exports = router;
