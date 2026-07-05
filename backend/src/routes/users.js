const express = require('express');
const leaderboardController = require('../controllers/leaderboardController');
const auth = require('../middleware/auth');

const router = express.Router();

// Require auth to view profiles
router.use(auth);

// @route   GET /api/users/:userId
// @desc    Get user profile and statistics
router.get('/:userId', leaderboardController.getUserProfile);

module.exports = router;
