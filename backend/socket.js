import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Message from './models/Message.js';
import Invitation from './models/Invitation.js';

const onlineUsers = new Map(); // userId -> socketId
const idleUsers = new Set(); // userId -> idle
const lastSeen = new Map(); // userId -> ISO timestamp

export const setupSocketIO = (app, io) => {
    app.set('io', io);
    app.set('onlineUsers', onlineUsers);

    // Middleware for Socket Auth
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }
            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        onlineUsers.set(userId, socket.id);

        // Broadcast updated online users list
        io.emit('online_users', Array.from(onlineUsers.keys()));
        io.emit('idle_users', Array.from(idleUsers));
        io.emit('last_seen_map', Object.fromEntries(lastSeen));

        // Broadcast the incoming user so clients can add them to their contacts list if they are new
        socket.broadcast.emit('user_connected', {
            _id: socket.user._id,
            username: socket.user.username,
            avatar: socket.user.avatar,
            email: socket.user.email
        });

        console.log(`User connected: ${socket.user.username} (${socket.id})`);

        // --- Events ---

        // 1. Send Message (Global or Private)
        socket.on('send_message', async (data) => {
            try {
                const { receiverId, content, fileUrl, fileType, fileName } = data;

                if (receiverId) {
                    const hasAcceptedInvite = await Invitation.findOne({
                        $or: [
                            { sender: userId, receiver: receiverId },
                            { sender: receiverId, receiver: userId }
                        ],
                        status: 'accepted'
                    });

                    if (!hasAcceptedInvite) {
                        return socket.emit('error', { message: 'You must have an accepted invitation to message this user' });
                    }
                }

                // Save to DB
                const newMessage = await Message.create({
                    senderId: userId,
                    receiverId: receiverId || null,
                    content: content || '',
                    fileUrl: fileUrl || null,
                    fileType: fileType || null,
                    fileName: fileName || null
                });

                const populatedMessage = await Message.findById(newMessage._id).populate('senderId', 'username avatar');

                if (receiverId) {
                    // Private Message
                    const receiverSocketId = onlineUsers.get(receiverId);
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('receive_message', populatedMessage);
                    }
                    // Emit to sender as well to update UI
                    socket.emit('receive_message', populatedMessage);
                } else {
                    // Global Message
                    io.emit('receive_message', populatedMessage);
                }
            } catch (err) {
                console.error('Send message error:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // 2. Typing indicators
        socket.on('typing', ({ receiverId, isTyping }) => {
            if (receiverId) {
                // Private typing
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('user_typing', { userId, isTyping, receiverId });
                }
            } else {
                // Global typing
                socket.broadcast.emit('user_typing', { userId, isTyping, receiverId: null });
            }
        });

        // 3. Reactions
        socket.on('react_message', async ({ messageId, emoji }) => {
            try {
                const message = await Message.findById(messageId);
                if (!message) return;

                const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);

                if (reactionIndex > -1) {
                    const userIndex = message.reactions[reactionIndex].users.indexOf(userId);
                    if (userIndex > -1) {
                        // Remove user from this reaction
                        message.reactions[reactionIndex].users.splice(userIndex, 1);
                        if (message.reactions[reactionIndex].users.length === 0) {
                            message.reactions.splice(reactionIndex, 1);
                        }
                    } else {
                        // Add user to existing reaction
                        message.reactions[reactionIndex].users.push(userId);
                    }
                } else {
                    // Create new reaction
                    message.reactions.push({ emoji, users: [userId] });
                }

                await message.save();

                // Broadcast to receiver if private, else global
                if (message.receiverId) {
                    const receiverSocketId = onlineUsers.get(message.receiverId.toString());
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('message_reacted', { messageId, reactions: message.reactions });
                    }
                    socket.emit('message_reacted', { messageId, reactions: message.reactions });
                } else {
                    io.emit('message_reacted', { messageId, reactions: message.reactions });
                }
            } catch (error) {
                console.error('Reaction error:', error);
            }
        });

        // 4. Pin Message
        socket.on('pin_message', async ({ messageId }) => {
            try {
                const message = await Message.findById(messageId);
                if (!message) return;

                message.isPinned = !message.isPinned;
                await message.save();

                if (message.receiverId) {
                    const receiverSocketId = onlineUsers.get(message.receiverId.toString());
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('message_pinned', { messageId, isPinned: message.isPinned });
                    }
                    socket.emit('message_pinned', { messageId, isPinned: message.isPinned });
                } else {
                    io.emit('message_pinned', { messageId, isPinned: message.isPinned });
                }
            } catch (error) {
                console.error('Pin error:', error);
            }
        });

        // 5. Mark Read
        socket.on('mark_read', async ({ messageId }) => {
            try {
                const message = await Message.findById(messageId);
                if (!message || message.receiverId?.toString() !== userId) return; // Only receiver can mark as read for private, or anyone for global (if we support global read receipts)

                if (!message.readBy.includes(userId)) {
                    message.readBy.push(userId);
                    await message.save();

                    const senderSocketId = onlineUsers.get(message.senderId.toString());
                    if (senderSocketId) {
                        io.to(senderSocketId).emit('message_read', { messageId, readBy: message.readBy });
                    }
                    socket.emit('message_read', { messageId, readBy: message.readBy });
                }
            } catch (error) {
                console.error('Read receipt error:', error);
            }
        });

        // 6. Idle Detection
        socket.on('user_idle', ({ isIdle }) => {
            if (isIdle) {
                idleUsers.add(userId);
            } else {
                idleUsers.delete(userId);
            }
            io.emit('idle_users', Array.from(idleUsers));
        });

        // Disconnect
        socket.on('disconnect', () => {
            onlineUsers.delete(userId);
            idleUsers.delete(userId);
            lastSeen.set(userId, new Date().toISOString());
            io.emit('online_users', Array.from(onlineUsers.keys()));
            io.emit('idle_users', Array.from(idleUsers));
            io.emit('last_seen_map', Object.fromEntries(lastSeen));
            console.log(`User disconnected: ${socket.user.username}`);
        });
    });
};
