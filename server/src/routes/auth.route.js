import express from 'express';
import { register, login, getMe, verifyEmail, resendOtp, forgotPassword, verifyForgotPasswordOtp, resetPassword } from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOtp);
router.post('/reset-password', resetPassword);

router.post('/login', login);
router.get('/me', authMiddleware, getMe);

export default router;
