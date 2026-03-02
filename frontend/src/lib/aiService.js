import { API_URL } from '../config';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';

const getHeaders = () => ({
    Authorization: `Bearer ${useAuthStore.getState().token}`
});

/**
 * Summarize the last 50 messages of a conversation.
 * Falls back to a local simple extraction if backend unavailable.
 */
export const summarizeConversation = async (messages) => {
    const last50 = messages.slice(-50).map(m => ({
        sender: m.senderId?.username || 'User',
        content: m.content || (m.fileType ? `[${m.fileType} attachment]` : '')
    })).filter(m => m.content);

    try {
        const res = await axios.post(`${API_URL}/ai/summarize`, { messages: last50 }, {
            headers: getHeaders(),
            timeout: 15000
        });
        return res.data.summary;
    } catch {
        // Local fallback: pick 5 unique statements
        const texts = last50.map(m => `${m.sender}: ${m.content}`).slice(-10).join('\n');
        return `Conversation highlights (last ${last50.length} messages):\n\n${texts}`;
    }
};

/**
 * Get smart reply suggestions based on the last message.
 */
export const getSmartReplies = async (lastMessage) => {
    try {
        const res = await axios.post(`${API_URL}/ai/smart-replies`, {
            message: lastMessage?.content || ''
        }, {
            headers: getHeaders(),
            timeout: 10000
        });
        return res.data.suggestions || [];
    } catch {
        // Local fallback suggestions
        const text = (lastMessage?.content || '').toLowerCase();
        if (text.includes('?')) return ['Sure!', 'Let me check', 'Good question!'];
        if (text.includes('thanks')) return ['No problem!', 'Anytime!', '😊'];
        return ['Got it!', 'Sounds good!', 'Thanks!'];
    }
};

/**
 * Rephrase a message with optional tone.
 */
export const rephraseMessage = async (text, tone = 'casual') => {
    try {
        const res = await axios.post(`${API_URL}/ai/rephrase`, { text, tone }, {
            headers: getHeaders(),
            timeout: 10000
        });
        return res.data.rephrased;
    } catch {
        return text; // Return original on failure
    }
};
