import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../config';

/**
 * Extract a clean, user-facing error message from an axios error.
 * Never exposes raw stack traces or SSL errors to the user.
 */
const extractError = (err) => {
    // Server responded with a structured JSON error
    if (err.response?.data?.message) {
        return err.response.data.message;
    }
    // Network error (server down, TLS mismatch, timeout, etc.)
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        return 'Cannot reach the server. Please check your connection.';
    }
    if (err.code === 'ECONNABORTED') {
        return 'Request timed out. Please try again.';
    }
    // Fallback — never leak raw OpenSSL / stack trace text
    return 'Something went wrong. Please try again.';
};

export const useAuthStore = create((set, get) => ({
    user: null,
    token: localStorage.getItem('token') || null,
    // Start with isLoading=true if we have a token — checkAuth must run first
    isLoading: !!localStorage.getItem('token'),
    error: null,

    register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axios.post(`${API_URL}/auth/register`, userData);
            set({ user: res.data, token: res.data.token, isLoading: false });
            localStorage.setItem('token', res.data.token);
            return true;
        } catch (err) {
            set({ error: extractError(err), isLoading: false });
            return false;
        }
    },

    login: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axios.post(`${API_URL}/auth/login`, userData);
            set({ user: res.data, token: res.data.token, isLoading: false });
            localStorage.setItem('token', res.data.token);
            return true;
        } catch (err) {
            set({ error: extractError(err), isLoading: false });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, error: null });
    },

    updateProfile: async ({ username, avatar, displayName, bio, statusMessage }) => {
        const { token } = get();
        set({ isLoading: true, error: null });
        try {
            const res = await axios.put(`${API_URL}/auth/profile`, { username, avatar, displayName, bio, statusMessage }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ user: res.data, isLoading: false });
            return true;
        } catch (err) {
            set({ error: extractError(err), isLoading: false });
            return false;
        }
    },

    checkAuth: async () => {
        const { token } = get();
        if (!token) {
            set({ isLoading: false });
            return;
        }
        set({ isLoading: true });
        try {
            const res = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ user: res.data, isLoading: false });
        } catch (err) {
            // Token is invalid/expired — clear it silently
            console.warn('[checkAuth] token rejected:', err.response?.status);
            localStorage.removeItem('token');
            set({ user: null, token: null, isLoading: false });
        }
    },
}));
