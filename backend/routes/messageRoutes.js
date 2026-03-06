import express from 'express';
import { getGlobalMessages, getPrivateMessages, getUserMedia, deleteUserMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/global', protect, getGlobalMessages);
router.get('/media', protect, getUserMedia);
router.get('/private/:userId', protect, getPrivateMessages);
router.delete('/:id', protect, deleteUserMessage);

export default router;
