const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
router.post(
  '/register',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    body('fullName', 'Full name is required').notEmpty(),
    body('dateOfBirth')
      .isISO8601()
      .withMessage('Please include a valid date of birth')
      .custom((value) => {
        const dob = new Date(value);
        const today = new Date();
        if (dob >= today) {
          throw new Error('Date of birth cannot be in the future');
        }
        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - 120);
        if (dob < minDate) {
          throw new Error('Age cannot exceed 120 years');
        }
        return true;
      }),
    validate,
  ],
  authController.register
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
    validate,
  ],
  authController.login
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token using refresh token
router.post(
  '/refresh',
  [
    body('refreshToken', 'Refresh token is required').notEmpty(),
    validate,
  ],
  authController.refresh
);

// @route   GET /api/auth/verify
// @desc    Verify current user session
router.get('/verify', authMiddleware, authController.verifyToken);

module.exports = router;
