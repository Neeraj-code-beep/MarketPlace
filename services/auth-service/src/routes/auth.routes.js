import express from 'express';
import respondWithValidationErrors from '../middlewares/validate.middleware.js';
import registerUserValidations from '../validators/auth.validator.js';
import authController from '../controllers/auth.controller.js';

const router = express.Router();

router.post(
  '/register',
  registerUserValidations,
  respondWithValidationErrors,
  authController.registerUser,
);

export default router;
