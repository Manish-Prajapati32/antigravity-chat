/**
 * Message Grouping System — Antigravity Chat
 * Groups consecutive messages from the same user within a 5-minute window.
 */

const GROUP_TIME_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Returns an array of grouped message objects.
 * Each item is either a { type: 'date', date } separator
 * or a { type: 'group', senderId, messages[], isOwn } group.
 *
 * Within each group, every message has:
 *   - isFirst: boolean (show avatar + name)
 *   - isLast: boolean (show timestamp, tail)
 *   - isOnly: boolean (both first and last)
 */
export function groupMessages(messages, currentUserId) {
    if (!messages || messages.length === 0) return [];

    const result = [];
    let lastDateStr = null;
    let currentGroup = null;

    const getDateStr = (ts) => {
        const d = new Date(ts);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    };

    const getDay = (ts) => {
        const d = new Date(ts);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const flushGroup = () => {
        if (currentGroup && currentGroup.messages.length > 0) {
            const msgs = currentGroup.messages;
            msgs.forEach((m, i) => {
                m.isFirst = i === 0;
                m.isLast = i === msgs.length - 1;
                m.isOnly = msgs.length === 1;
            });
            result.push({ type: 'group', ...currentGroup });
            currentGroup = null;
        }
    };

    for (const msg of messages) {
        const ts = msg.createdAt || new Date().toISOString();
        const dateStr = getDateStr(ts);
        const senderId = msg.senderId?._id || msg.senderId;
        const isOwn = senderId === currentUserId;

        // Date separator
        if (dateStr !== lastDateStr) {
            flushGroup();
            result.push({ type: 'date', label: getDay(ts) });
            lastDateStr = dateStr;
        }

        // Check if we can extend the current group
        const canGroup =
            currentGroup &&
            currentGroup.senderId === senderId &&
            new Date(ts) - new Date(currentGroup.messages.at(-1).createdAt) < GROUP_TIME_WINDOW_MS;

        if (canGroup) {
            currentGroup.messages.push({ ...msg, isFirst: false, isLast: true, isOnly: false });
        } else {
            flushGroup();
            currentGroup = {
                senderId,
                senderInfo: msg.senderId,
                isOwn,
                messages: [{ ...msg, isFirst: true, isLast: true, isOnly: true }],
            };
        }
    }

    flushGroup();
    return result;
}
