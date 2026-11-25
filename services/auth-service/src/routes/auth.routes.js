import express from 'express';
import respondWithValidationErrors from '../middlewares/validate.middleware.js';
import authValidator from '../validators/auth.validator.js';
import authController from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middlware.js';

const router = express.Router();

// POST /auth/register
router.post(
  '/register',
  authValidator.registerUserValidations,
  respondWithValidationErrors,
  authController.registerUser,
);

// POST /auth/login
router.post(
  '/login',
  authValidator.loginUserValidations,
  respondWithValidationErrors,
  authController.loginUser,
);

// GET /api/auth/me
router.get('/me', authMiddleware, authController.getCurrentUser);

router.post('/logout', authController.logoutUser);

export default router;
