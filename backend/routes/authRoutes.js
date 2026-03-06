import express from 'express';
import rateLimit from 'express-rate-limit';
import { registerUser, authUser, getUserProfile, getAllUsers, updateUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict rate limiters to prevent brute-force & account spam
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Please try again after 15 minutes.' }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many accounts created from this IP. Please try again after an hour.' }
});

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, authUser);
router.get('/me', protect, getUserProfile);
router.get('/users', protect, getAllUsers);
router.put('/profile', protect, updateUserProfile);

export default router;
