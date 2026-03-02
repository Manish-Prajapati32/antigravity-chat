import Invitation from '../models/Invitation.js';
import User from '../models/User.js';

// @desc    Send a private messaging invitation
// @route   POST /api/invitations/send
export const sendInvitation = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user._id;

        if (senderId.toString() === receiverId) {
            return res.status(400).json({ message: "Cannot send invitation to yourself" });
        }

        // Check if an invitation already exists between these users (pending or accepted)
        const existingInv = await Invitation.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ],
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingInv) {
            return res.status(400).json({ message: "Invitation already exists or users are already connected" });
        }

        const invitation = await Invitation.create({
            sender: senderId,
            receiver: receiverId
        });

        const populatedInv = await invitation.populate('sender receiver', 'username avatar');

        // Emit real-time event to receiver
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');

        if (io && onlineUsers) {
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('new_invitation', populatedInv);
            }
        }

        res.status(201).json(populatedInv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept an invitation
// @route   PUT /api/invitations/accept/:id
export const acceptInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id);

        if (!invitation) {
            return res.status(404).json({ message: "Invitation not found" });
        }

        // Ensure the current user is the receiver
        if (invitation.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to accept this invitation" });
        }

        invitation.status = 'accepted';
        await invitation.save();

        const populatedInv = await invitation.populate('sender receiver', 'username avatar');

        // Emit real-time event to sender
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');

        if (io && onlineUsers) {
            const senderSocketId = onlineUsers.get(invitation.sender._id.toString());
            if (senderSocketId) {
                io.to(senderSocketId).emit('invitation_accepted', populatedInv);
            }
        }

        res.json(populatedInv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject an invitation
// @route   PUT /api/invitations/reject/:id
export const rejectInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id);

        if (!invitation) {
            return res.status(404).json({ message: "Invitation not found" });
        }

        // Ensure the current user is the receiver
        if (invitation.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to reject this invitation" });
        }

        invitation.status = 'rejected';
        await invitation.save();

        // Emit real-time event to sender
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');

        if (io && onlineUsers) {
            const senderSocketId = onlineUsers.get(invitation.sender.toString());
            if (senderSocketId) {
                io.to(senderSocketId).emit('invitation_rejected', { _id: invitation._id });
            }
        }

        res.json({ message: "Invitation rejected", _id: invitation._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all invitations for the logged in user (sent and received)
// @route   GET /api/invitations
export const getInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({
            $or: [{ sender: req.user._id }, { receiver: req.user._id }]
        }).populate('sender receiver', 'username avatar');

        res.json(invitations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
