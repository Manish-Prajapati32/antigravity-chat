import User from '../models/User.js';
import Message from '../models/Message.js';
import ActivityLog from '../models/ActivityLog.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');

// Helper to delete a file from disk
const deleteFile = (fileUrl) => {
    if (!fileUrl) return;
    const filename = path.basename(fileUrl);
    const filepath = path.join(uploadsDir, filename);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    }
};

// Helper to create an activity log entry
const log = async (action, detail, actorId, targetId = null, targetType = null) => {
    try {
        await ActivityLog.create({ action, detail, actorId, targetId, targetType });
    } catch (e) {
        console.error('Log error:', e);
    }
};

// ─── STATS ───────────────────────────────────────────────────────────────────

// GET /api/admin/stats
export const getStats = async (req, res, next) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [totalUsers, totalMessages, messagesToday, totalMedia, bannedUsers] = await Promise.all([
            User.countDocuments(),
            Message.countDocuments(),
            Message.countDocuments({ createdAt: { $gte: todayStart } }),
            Message.countDocuments({ fileUrl: { $ne: null } }),
            User.countDocuments({ isBanned: true }),
        ]);

        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const activeUsers = onlineUsers ? onlineUsers.size : 0;

        res.json({ totalUsers, totalMessages, messagesToday, totalMedia, bannedUsers, activeUsers });
    } catch (error) {
        next(error);
    }
};

// GET /api/admin/stats/messages-per-day
export const getMessagesPerDay = async (req, res, next) => {
    try {
        const days = 7;
        const result = [];
        for (let i = days - 1; i >= 0; i--) {
            const start = new Date();
            start.setDate(start.getDate() - i);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            const count = await Message.countDocuments({ createdAt: { $gte: start, $lt: end } });
            result.push({
                date: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                messages: count
            });
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// GET /api/admin/stats/users-per-week
export const getUsersPerWeek = async (req, res, next) => {
    try {
        const weeks = 4;
        const result = [];
        for (let i = weeks - 1; i >= 0; i--) {
            const start = new Date();
            start.setDate(start.getDate() - (i + 1) * 7);
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setDate(end.getDate() - i * 7);
            end.setHours(0, 0, 0, 0);
            const count = await User.countDocuments({ createdAt: { $gte: start, $lt: end } });
            result.push({
                week: `W${weeks - i}`,
                users: count
            });
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// ─── USERS ────────────────────────────────────────────────────────────────────

// GET /api/admin/users
export const getAllUsers = async (req, res, next) => {
    try {
        const { search } = req.query;
        const query = search
            ? { $or: [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
            : {};
        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete another admin.' });

        // Delete all their messages and associated files
        const userMessages = await Message.find({ senderId: id, fileUrl: { $ne: null } });
        userMessages.forEach(m => deleteFile(m.fileUrl));
        await Message.deleteMany({ $or: [{ senderId: id }, { receiverId: id }] });

        await User.findByIdAndDelete(id);
        await log('USER_DELETED', `Deleted user ${user.username} (${user.email})`, req.user._id, id, 'user');
        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/admin/users/:id/ban
export const toggleBanUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (user.role === 'admin') return res.status(403).json({ message: 'Cannot ban an admin.' });

        user.isBanned = !user.isBanned;
        await user.save();

        const action = user.isBanned ? 'USER_BANNED' : 'USER_UNBANNED';
        await log(action, `${action.replace('_', ' ')} user ${user.username}`, req.user._id, id, 'user');
        res.json({ isBanned: user.isBanned, message: user.isBanned ? 'User banned.' : 'User unbanned.' });
    } catch (error) {
        next(error);
    }
};

// POST /api/admin/users/:id/reset-password
export const resetUserPassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const tempPassword = Math.random().toString(36).slice(-8);
        user.password = tempPassword; // will be hashed by pre-save hook
        await user.save();

        await log('PASSWORD_RESET', `Reset password for ${user.username}`, req.user._id, id, 'user');
        res.json({ message: 'Password reset.', tempPassword });
    } catch (error) {
        next(error);
    }
};

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

// GET /api/admin/messages?search=&page=1&limit=50
export const getAllMessages = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        const query = search
            ? { content: { $regex: search, $options: 'i' } }
            : {};

        const total = await Message.countDocuments(query);
        const messages = await Message.find(query)
            .populate('senderId', 'username avatar email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ messages, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/admin/messages/:id
export const deleteMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const msg = await Message.findById(id).populate('senderId', 'username');
        if (!msg) return res.status(404).json({ message: 'Message not found.' });

        if (msg.fileUrl) deleteFile(msg.fileUrl);
        await Message.findByIdAndDelete(id);

        // Emit socket event so all connected clients remove the message from UI
        const io = req.app.get('io');
        if (io) io.emit('message_deleted_by_admin', { messageId: id });

        await log('MESSAGE_DELETED', `Deleted message from ${msg.senderId?.username}: "${msg.content?.slice(0, 50)}"`, req.user._id, id, 'message');
        res.json({ message: 'Message deleted.' });
    } catch (error) {
        next(error);
    }
};

// ─── MEDIA ────────────────────────────────────────────────────────────────────

// GET /api/admin/media?type=image
export const getAllMedia = async (req, res, next) => {
    try {
        const { type } = req.query;
        const query = { fileUrl: { $ne: null } };
        if (type) query.fileType = type;

        const media = await Message.find(query)
            .populate('senderId', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(200);

        res.json(media);
    } catch (error) {
        next(error);
    }
};

// ─── LOGS ─────────────────────────────────────────────────────────────────────

// GET /api/admin/logs
export const getLogs = async (req, res, next) => {
    try {
        const logs = await ActivityLog.find()
            .populate('actorId', 'username email')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
    } catch (error) {
        next(error);
    }
};

// ─── BROADCAST ────────────────────────────────────────────────────────────────

// POST /api/admin/broadcast
export const broadcastMessage = async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message?.trim()) return res.status(400).json({ message: 'Message cannot be empty.' });

        const io = req.app.get('io');
        if (io) {
            io.emit('admin_broadcast', {
                message: message.trim(),
                from: req.user.username,
                timestamp: new Date().toISOString()
            });
        }

        await log('USER_BROADCAST', `Broadcast: "${message.trim().slice(0, 100)}"`, req.user._id, null, null);
        res.json({ message: 'Broadcast sent.' });
    } catch (error) {
        next(error);
    }
};
