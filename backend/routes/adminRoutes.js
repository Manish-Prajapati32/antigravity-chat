import express from 'express';
import { adminProtect } from '../middleware/adminMiddleware.js';
import {
    getStats,
    getMessagesPerDay,
    getUsersPerWeek,
    getAllUsers,
    deleteUser,
    toggleBanUser,
    resetUserPassword,
    getAllMessages,
    deleteMessage,
    getAllMedia,
    getLogs,
    broadcastMessage
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require admin auth
router.use(adminProtect);

// Stats
router.get('/stats', getStats);
router.get('/stats/messages-per-day', getMessagesPerDay);
router.get('/stats/users-per-week', getUsersPerWeek);

// Users
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/ban', toggleBanUser);
router.post('/users/:id/reset-password', resetUserPassword);

// Messages
router.get('/messages', getAllMessages);
router.delete('/messages/:id', deleteMessage);

// Media
router.get('/media', getAllMedia);

// Logs
router.get('/logs', getLogs);

// Broadcast
router.post('/broadcast', broadcastMessage);

export default router;
