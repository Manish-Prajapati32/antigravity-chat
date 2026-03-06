import Message from '../models/Message.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get global chat messages
// @route   GET /api/messages/global
export const getGlobalMessages = async (req, res) => {
    try {
        const messages = await Message.find({ receiverId: null })
            .populate('senderId', 'username avatar email')
            .sort({ createdAt: 1 }) // oldest first, or we can limit
            .limit(100);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get private chat messages between current user and another user
// @route   GET /api/messages/private/:userId
export const getPrivateMessages = async (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const currentUserId = req.user._id;

        const hasAcceptedInvite = await Invitation.findOne({
            $or: [
                { sender: currentUserId, receiver: otherUserId },
                { sender: otherUserId, receiver: currentUserId }
            ],
            status: 'accepted'
        });

        if (!hasAcceptedInvite) {
            return res.json([]); // Return empty array if no accepted invitation exists
        }

        const messages = await Message.find({
            $or: [
                { senderId: currentUserId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: currentUserId }
            ]
        })
            .populate('senderId', 'username avatar')
            .sort({ createdAt: 1 })
            .limit(100);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all media files uploaded by user or sent to user
// @route   GET /api/messages/media
export const getUserMedia = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const mediaMessages = await Message.find({
            $or: [
                { senderId: currentUserId, fileUrl: { $ne: null } },
                { receiverId: currentUserId, fileUrl: { $ne: null } },
                { receiverId: null, fileUrl: { $ne: null } } // global room media
            ],
            fileType: { $ne: null }
        })
            .populate('senderId', 'username avatar')
            .sort({ createdAt: -1 });

        res.json(mediaMessages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete message (for me or everyone)
// @route   DELETE /api/messages/:id
export const deleteUserMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type } = req.body; // 'me' or 'everyone'

        const msg = await Message.findById(id);
        if (!msg) return res.status(404).json({ message: 'Message not found.' });

        // If deleting for everyone, only sender can do it
        if (type === 'everyone') {
            if (msg.senderId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'You can only delete your own messages for everyone.' });
            }

            msg.isDeletedForAll = true;
            msg.content = '🚫 This message was deleted';
            if (msg.fileUrl) {
                const filepath = path.join(__dirname, '..', 'uploads', path.basename(msg.fileUrl));
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
                msg.fileUrl = null;
                msg.fileType = null;
                msg.fileName = null;
            }
            // Clear reactions
            msg.reactions = [];
            await msg.save();

            // Emit socket event to ensure real-time UI updates
            const io = req.app.get('io');
            if (io) io.emit('message_deleted_for_everyone', { messageId: id, roomId: msg.receiverId || 'global' });

        } else {
            // Delete for me
            if (!msg.deletedFor.includes(req.user._id)) {
                msg.deletedFor.push(req.user._id);
                await msg.save();
            }
        }

        res.json({ message: 'Message deleted successfully', messageId: id, type });
    } catch (error) {
        next(error);
    }
};
