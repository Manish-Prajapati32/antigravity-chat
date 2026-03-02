/**
 * AI Controller — Antigravity Chat Backend
 * Uses Google Gemini if GEMINI_API_KEY is set, otherwise a smart local fallback.
 */

const callGemini = async (prompt) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 512, temperature: 0.7 }
                }),
                signal: AbortSignal.timeout(12000)
            }
        );
        const json = await res.json();
        return json?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch {
        return null;
    }
};

// @route POST /api/ai/summarize
export const summarize = async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages?.length) return res.json({ summary: 'No messages to summarize.' });

        const transcript = messages
            .slice(-50)
            .map(m => `${m.sender}: ${m.content}`)
            .join('\n');

        const prompt = `You are summarizing a chat conversation. Be concise (3-5 sentences max). Focus on key topics discussed.\n\nConversation:\n${transcript}\n\nSummary:`;

        const summary = await callGemini(prompt) ||
            `Conversation covered ${messages.length} messages. Topics: ${[...new Set(messages.map(m => m.content?.split(' ').slice(0, 2).join(' ')))].slice(0, 4).join(', ')}.`;

        res.json({ summary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route POST /api/ai/smart-replies
export const smartReplies = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.json({ suggestions: ['Got it!', 'Sounds good!', 'Thanks!'] });

        const prompt = `Generate exactly 3 short, natural chat reply suggestions (5-8 words each) for this message: "${message}"\n\nReply with ONLY a JSON array of 3 strings, no explanation.`;

        const raw = await callGemini(prompt);
        let suggestions = ['Got it!', 'Sounds good!', 'Thanks!'];

        if (raw) {
            try {
                const match = raw.match(/\[.*\]/s);
                if (match) suggestions = JSON.parse(match[0]).slice(0, 3);
            } catch { /* use defaults */ }
        }

        res.json({ suggestions });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route POST /api/ai/rephrase
export const rephrase = async (req, res) => {
    try {
        const { text, tone = 'casual' } = req.body;
        if (!text) return res.json({ rephrased: text });

        const toneDesc = {
            casual: 'casual and friendly',
            professional: 'formal and professional',
            friendly: 'warm, positive, and encouraging'
        }[tone] || 'casual and friendly';

        const prompt = `Rephrase the following message in a ${toneDesc} tone. Keep it concise. Respond with ONLY the rephrased text.\n\nOriginal: "${text}"\n\nRephrased:`;

        const rephrased = await callGemini(prompt) || text;
        res.json({ rephrased: rephrased.trim().replace(/^["']|["']$/g, '') });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
