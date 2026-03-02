import express from 'express';
import { registerUser, authUser, getUserProfile, getAllUsers, updateUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/me', protect, getUserProfile);
router.get('/users', protect, getAllUsers);
router.put('/profile', protect, updateUserProfile);

export default router;
