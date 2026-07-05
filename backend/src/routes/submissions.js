const express = require('express');
const { body } = require('express-validator');
const submissionController = require('../controllers/submissionController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   POST /api/submissions/run
// @desc    Run code for quick verification (against sample cases or custom input)
router.post(
  '/run',
  [
    body('problemId', 'Problem ID must be a valid Mongo ID').optional({ nullable: true }).isMongoId(),
    body('code', 'Code is required').notEmpty(),
    body('language', 'Language must be C++, Java, or Python').isIn(['C++', 'Java', 'Python']),
    validate,
  ],
  submissionController.runCode
);

// @route   POST /api/submissions
// @desc    Submit a solution for final evaluation
router.post(
  '/',
  [
    body('problemId', 'Problem ID is required').isMongoId(),
    body('code', 'Code is required').notEmpty(),
    body('language', 'Language must be C++, Java, or Python').isIn(['C++', 'Java', 'Python']),
    validate,
  ],
  submissionController.submitCode
);

// @route   GET /api/submissions
// @desc    Get submissions list (filtered, paginated)
router.get('/', submissionController.getSubmissions);

// @route   GET /api/submissions/:id
// @desc    Get specific submission details
router.get('/:id', submissionController.getSubmissionById);

module.exports = router;
