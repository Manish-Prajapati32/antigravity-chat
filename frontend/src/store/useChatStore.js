import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import { API_URL, BASE_URL as SOCKET_URL } from '../config';

export const useChatStore = create((set, get) => ({
    socket: null,
    onlineUsers: [],
    idleUsers: [],
    lastSeen: {},
    messages: [],
    globalMessages: [],
    activeChat: null,
    users: [],
    invitations: [],
    unreadMessages: {},
    isTyping: false,
    typingUsers: {},
    isLoading: false,
    error: null,

    connectSocket: () => {
        const token = useAuthStore.getState().token;
        if (!token || get().socket) return;

        const socket = io(SOCKET_URL, {
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('Socket connected');
        });

        socket.on('online_users', (users) => {
            set({ onlineUsers: users });
        });

        socket.on('idle_users', (users) => {
            set({ idleUsers: users });
        });

        socket.on('last_seen_map', (map) => {
            set({ lastSeen: map });
        });

        socket.on('user_connected', (newUser) => {
            set((state) => {
                const userExists = state.users.some(u => u._id === newUser._id);
                if (!userExists) {
                    return { users: [...state.users, newUser] };
                }
                return state;
            });
        });

        socket.on('receive_message', (message) => {
            const { activeChat } = get();

            // If it's a global message
            if (!message.receiverId) {
                set((state) => ({ globalMessages: [...state.globalMessages, message] }));
            } else {
                // Private message
                const currentUserId = useAuthStore.getState().user?._id;
                const isParticipant = message.senderId._id === currentUserId || message.receiverId === currentUserId;

                if (isParticipant) {
                    const isRelevantToActiveChat =
                        (activeChat === message.senderId._id && message.receiverId === currentUserId) ||
                        (activeChat === message.receiverId && message.senderId._id === currentUserId);

                    if (isRelevantToActiveChat) {
                        set((state) => ({ messages: [...state.messages, message] }));
                    } else if (message.receiverId === currentUserId) {
                        // Increment unread count for the sender
                        set((state) => ({
                            unreadMessages: {
                                ...state.unreadMessages,
                                [message.senderId._id]: (state.unreadMessages[message.senderId._id] || 0) + 1
                            }
                        }));
                    }
                }
            }
        });

        socket.on('user_typing', ({ userId, isTyping, receiverId }) => {
            set((state) => ({
                typingUsers: {
                    ...state.typingUsers,
                    [receiverId ? userId : 'global']: isTyping
                }
            }));
        });

        socket.on('new_invitation', (invitation) => {
            set((state) => ({ invitations: [...state.invitations, invitation] }));
        });

        socket.on('invitation_accepted', (invitation) => {
            set((state) => ({
                invitations: state.invitations.map(inv =>
                    inv._id === invitation._id ? invitation : inv
                )
            }));
        });

        socket.on('invitation_rejected', ({ _id }) => {
            set((state) => ({
                invitations: state.invitations.map(inv =>
                    inv._id === _id ? { ...inv, status: 'rejected' } : inv
                )
            }));
        });

        socket.on('error', (err) => {
            set({ error: err.message });
            setTimeout(() => set({ error: null }), 5000);
        });

        socket.on('message_reacted', ({ messageId, reactions }) => {
            set((state) => ({
                messages: state.messages.map(msg =>
                    msg._id === messageId ? { ...msg, reactions } : msg
                ),
                globalMessages: state.globalMessages.map(msg =>
                    msg._id === messageId ? { ...msg, reactions } : msg
                )
            }));
        });

        socket.on('message_pinned', ({ messageId, isPinned }) => {
            set((state) => ({
                messages: state.messages.map(msg =>
                    msg._id === messageId ? { ...msg, isPinned } : msg
                ),
                globalMessages: state.globalMessages.map(msg =>
                    msg._id === messageId ? { ...msg, isPinned } : msg
                )
            }));
        });

        socket.on('message_read', ({ messageId, readBy }) => {
            set((state) => ({
                messages: state.messages.map(msg =>
                    msg._id === messageId ? { ...msg, readBy } : msg
                ),
                globalMessages: state.globalMessages.map(msg =>
                    msg._id === messageId ? { ...msg, readBy } : msg
                )
            }));
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            socket.disconnect();
            set({ socket: null, onlineUsers: [] });
        }
    },

    fetchUsers: async () => {
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.get(`${API_URL}/auth/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ users: res.data });
        } catch (err) {
            console.error(err);
        }
    },

    fetchInvitations: async () => {
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.get(`${API_URL}/invitations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ invitations: res.data });
        } catch (err) {
            console.error(err);
        }
    },

    sendInvitation: async (receiverId) => {
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.post(`${API_URL}/invitations/send`, { receiverId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set((state) => ({ invitations: [...state.invitations, res.data] }));
        } catch (err) {
            set({ error: err.response?.data?.message || err.message });
            setTimeout(() => set({ error: null }), 5000);
            console.error(err);
        }
    },

    acceptInvitation: async (invitationId) => {
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.put(`${API_URL}/invitations/accept/${invitationId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set((state) => ({
                invitations: state.invitations.map(inv =>
                    inv._id === invitationId ? res.data : inv
                )
            }));
        } catch (err) {
            console.error(err);
        }
    },

    rejectInvitation: async (invitationId) => {
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.put(`${API_URL}/invitations/reject/${invitationId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Just update status to rejected
            set((state) => ({
                invitations: state.invitations.map(inv =>
                    inv._id === invitationId ? { ...inv, status: 'rejected' } : inv
                )
            }));
        } catch (err) {
            console.error(err);
        }
    },

    fetchGlobalMessages: async () => {
        set({ isLoading: true });
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.get(`${API_URL}/messages/global`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ globalMessages: res.data, isLoading: false, activeChat: null });
        } catch (err) {
            console.error(err);
            set({ isLoading: false });
        }
    },

    fetchPrivateMessages: async (userId) => {
        set({ isLoading: true });
        try {
            const token = useAuthStore.getState().token;
            const res = await axios.get(`${API_URL}/messages/private/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ messages: res.data, isLoading: false, activeChat: userId });
        } catch (err) {
            console.error(err);
            set({ isLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const socket = get().socket;
        if (socket) {
            socket.emit('send_message', messageData);
        }
    },

    sendTypingStatus: (isTyping) => {
        const socket = get().socket;
        const activeChat = get().activeChat;
        if (socket) {
            socket.emit('typing', { receiverId: activeChat, isTyping });
        }
    },

    setActiveChat: (userId) => {
        set({ activeChat: userId });
        // Clear unread count when switching to this chat
        if (userId) {
            set((state) => {
                const newUnread = { ...state.unreadMessages };
                delete newUnread[userId];
                return { unreadMessages: newUnread };
            });
        }
    },

    clearUnread: (userId) => {
        set((state) => {
            const newUnread = { ...state.unreadMessages };
            delete newUnread[userId];
            return { unreadMessages: newUnread };
        });
    },

    reactToMessage: (messageId, emoji) => {
        const socket = get().socket;
        if (socket) {
            socket.emit('react_message', { messageId, emoji });
        }
    },

    pinMessage: (messageId) => {
        const socket = get().socket;
        if (socket) {
            socket.emit('pin_message', { messageId });
        }
    },

    markAsRead: (messageId) => {
        const socket = get().socket;
        if (socket) {
            socket.emit('mark_read', { messageId });
        }
    },

    sendIdleStatus: (isIdle) => {
        const socket = get().socket;
        if (socket) {
            socket.emit('user_idle', { isIdle });
        }
    }
}));
