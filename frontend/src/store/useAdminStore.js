import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuthStore } from './useAuthStore';

const getHeaders = () => ({
    Authorization: `Bearer ${useAuthStore.getState().token}`
});

export const useAdminStore = create((set, get) => ({
    users: [],
    messages: [],
    messageMeta: { total: 0, pages: 1, page: 1 },
    media: [],
    logs: [],
    stats: null,
    messagesPerDay: [],
    usersPerWeek: [],
    isLoading: false,
    error: null,

    // ── Stats ──────────────────────────────────────────────
    fetchStats: async () => {
        try {
            const [statsRes, msgPerDayRes, usersPerWeekRes] = await Promise.all([
                axios.get(`${API_URL}/admin/stats`, { headers: getHeaders() }),
                axios.get(`${API_URL}/admin/stats/messages-per-day`, { headers: getHeaders() }),
                axios.get(`${API_URL}/admin/stats/users-per-week`, { headers: getHeaders() }),
            ]);
            set({
                stats: statsRes.data,
                messagesPerDay: msgPerDayRes.data,
                usersPerWeek: usersPerWeekRes.data,
            });
        } catch (err) {
            console.error('Admin stats error:', err);
        }
    },

    // ── Users ──────────────────────────────────────────────
    fetchUsers: async (search = '') => {
        set({ isLoading: true });
        try {
            const res = await axios.get(`${API_URL}/admin/users`, {
                headers: getHeaders(),
                params: search ? { search } : {}
            });
            set({ users: res.data, isLoading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || 'Failed to fetch users', isLoading: false });
        }
    },

    deleteUser: async (id) => {
        await axios.delete(`${API_URL}/admin/users/${id}`, { headers: getHeaders() });
        set(s => ({ users: s.users.filter(u => u._id !== id) }));
    },

    toggleBan: async (id) => {
        const res = await axios.patch(`${API_URL}/admin/users/${id}/ban`, {}, { headers: getHeaders() });
        set(s => ({
            users: s.users.map(u => u._id === id ? { ...u, isBanned: res.data.isBanned } : u)
        }));
    },

    resetPassword: async (id) => {
        const res = await axios.post(`${API_URL}/admin/users/${id}/reset-password`, {}, { headers: getHeaders() });
        return res.data.tempPassword;
    },

    // ── Messages ───────────────────────────────────────────
    fetchMessages: async (search = '', page = 1) => {
        set({ isLoading: true });
        try {
            const res = await axios.get(`${API_URL}/admin/messages`, {
                headers: getHeaders(),
                params: { search, page, limit: 50 }
            });
            set({ messages: res.data.messages, messageMeta: { total: res.data.total, pages: res.data.pages, page: res.data.page }, isLoading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || 'Failed to fetch messages', isLoading: false });
        }
    },

    deleteMessage: async (id) => {
        await axios.delete(`${API_URL}/admin/messages/${id}`, { headers: getHeaders() });
        set(s => ({ messages: s.messages.filter(m => m._id !== id) }));
    },

    // ── Media ──────────────────────────────────────────────
    fetchMedia: async (type = '') => {
        set({ isLoading: true });
        try {
            const res = await axios.get(`${API_URL}/admin/media`, {
                headers: getHeaders(),
                params: type ? { type } : {}
            });
            set({ media: res.data, isLoading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || 'Failed to fetch media', isLoading: false });
        }
    },

    deleteMedia: async (id) => {
        await axios.delete(`${API_URL}/admin/messages/${id}`, { headers: getHeaders() });
        set(s => ({ media: s.media.filter(m => m._id !== id) }));
    },

    // ── Logs ───────────────────────────────────────────────
    fetchLogs: async () => {
        const res = await axios.get(`${API_URL}/admin/logs`, { headers: getHeaders() });
        set({ logs: res.data });
    },

    // ── Broadcast ──────────────────────────────────────────
    broadcast: async (message) => {
        await axios.post(`${API_URL}/admin/broadcast`, { message }, { headers: getHeaders() });
    },
}));
