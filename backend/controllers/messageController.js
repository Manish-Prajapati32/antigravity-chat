import Message from '../models/Message.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';

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
