const express = require('express');
const { body } = require('express-validator');
const problemController = require('../controllers/problemController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/problems
// @desc    Get all problems (filtered, paginated, searchable)
router.get('/', problemController.getProblems);

// @route   GET /api/problems/:id
// @desc    Get a single problem by ID
router.get('/:id', problemController.getProblemById);

// @route   POST /api/problems
// @desc    Create a new problem (Admin only)
router.post(
  '/',
  [
    auth,
    admin,
    body('title', 'Title is required').notEmpty(),
    body('statement', 'Statement is required').notEmpty(),
    body('difficulty', 'Difficulty must be Easy, Medium, or Hard').isIn(['Easy', 'Medium', 'Hard']),
    body('testCases', 'At least one testcase is required').isArray({ min: 1 }),
    validate,
  ],
  problemController.createProblem
);

module.exports = router;
