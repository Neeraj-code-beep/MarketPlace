import { body } from 'express-validator';

// Validation rules for user registration
const registerUserValidations = [
  // -------------------- USERNAME VALIDATION --------------------

  body('username')
    .isString()
    .withMessage('Username must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .bail()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .bail()
    // Allow only letters, numbers and underscores
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),

  // -------------------- EMAIL VALIDATION --------------------

  body('email')
    .isString()
    .withMessage('Email must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .bail()
    // Normalize email to maintain consistency in the database
    .normalizeEmail(),

  // -------------------- PASSWORD VALIDATION --------------------

  body('password')
    // Don't trim passwords because spaces can be valid password characters
    .isString()
    .withMessage('Password must be a string')
    .bail()
    .notEmpty()
    .withMessage('Password is required')
    .bail()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters'),

  // -------------------- FIRST NAME VALIDATION --------------------

  body('fullName.firstName')
    .isString()
    .withMessage('First name must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .bail()
    // Allow letters, spaces, apostrophes and hyphens
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name contains invalid characters'),

  // -------------------- LAST NAME VALIDATION --------------------

  body('fullName.lastName')
    .isString()
    .withMessage('Last name must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .bail()
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name contains invalid characters'),
];

export default registerUserValidations;
