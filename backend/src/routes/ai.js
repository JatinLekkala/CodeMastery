const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

// All AI routes require authentication
router.use(auth);

// @route   POST /api/ai/complete
// @desc    Get AI code completion suggestion
router.post(
  '/complete',
  [
    body('code', 'Code is required').notEmpty(),
    body('language', 'Language must be C++, Java, or Python').isIn(['C++', 'Java', 'Python']),
    validate,
  ],
  aiController.getCompletion
);

// @route   POST /api/ai/review
// @desc    Get AI code best practices review
router.post(
  '/review',
  [
    body('code', 'Code is required').notEmpty(),
    body('language', 'Language must be C++, Java, or Python').isIn(['C++', 'Java', 'Python']),
    validate,
  ],
  aiController.getReview
);

module.exports = router;
