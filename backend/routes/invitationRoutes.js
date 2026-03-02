import express from 'express';
import {
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    getInvitations
} from '../controllers/invitationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getInvitations);

router.post('/send', protect, sendInvitation);
router.put('/accept/:id', protect, acceptInvitation);
router.put('/reject/:id', protect, rejectInvitation);

export default router;
