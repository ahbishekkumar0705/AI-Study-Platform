import express from 'express';
import {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logoutUser,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply auth rate limiting
const authLimiter = rateLimiter(20, 15 * 60 * 1000); // 20 requests per 15 minutes max for auth routes

router.post('/register', authLimiter, registerUser);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/refresh', refreshAccessToken);
router.post('/logout', protect, logoutUser);

export default router;
