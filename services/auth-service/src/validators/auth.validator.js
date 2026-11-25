import { body } from 'express-validator';
import respondWithValidationErrors from '../middlewares/validate.middleware';

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

  body('role')
    .optional()
    .isIn(['user', 'seller'])
    .withMessage("Role must be either 'user' or 'seller' "),
  respondWithValidationErrors,
];

// Validation rules for user login
const loginUserValidations = [
  // -------------------- IDENTIFIER VALIDATION --------------------

  body('identifier')
    .optional()
    .isString()
    .withMessage('Username or email must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),

  // Support existing email-based requests
  body('email')
    .optional()
    .isString()
    .withMessage('Email must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Email cannot be empty')
    .bail()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .bail()
    .normalizeEmail(),

  // Support existing username-based requests
  body('username')
    .optional()
    .isString()
    .withMessage('Username must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Username cannot be empty'),

  // -------------------- PASSWORD VALIDATION --------------------

  body('password')
    .isString()
    .withMessage('Password must be a string')
    .bail()
    .notEmpty()
    .withMessage('Password is required'),
];

const addUserAddressValidations = [
  body('street')
    .isString()
    .withMessage('Street must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Street is required')
    .bail()
    .isLength({ max: 150 })
    .withMessage('Street cannot exceed 150 characters'),

  body('city')
    .isString()
    .withMessage('City must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .bail()
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),

  body('state')
    .isString()
    .withMessage('State must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('State is required')
    .bail()
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),

  body('pincode')
    .isString()
    .withMessage('Pincode must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Pincode is required')
    .bail()
    .isLength({ min: 4, max: 10 })
    .withMessage('Pincode must be between 4 and 10 characters')
    .bail()
    .matches(/^[a-zA-Z0-9 -]+$/)
    .withMessage('Pincode contains invalid characters'),

  body('country')
    .isString()
    .withMessage('Country must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .bail()
    .isLength({ max: 56 })
    .withMessage('Country cannot exceed 56 characters'),

  body('phone')
    .isString()
    .withMessage('Phone number must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .bail()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('Please provide a valid phone number'),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean')
    .toBoolean(),
];

export default {
  registerUserValidations,
  loginUserValidations,
  addUserAddressValidations,
};
