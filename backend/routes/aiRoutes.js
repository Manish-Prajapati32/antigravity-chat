import express from 'express';
import { summarize, smartReplies, rephrase } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/summarize', protect, summarize);
router.post('/smart-replies', protect, smartReplies);
router.post('/rephrase', protect, rephrase);

export default router;
