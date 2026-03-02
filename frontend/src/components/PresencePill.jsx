import { useChatStore } from '../store/useChatStore';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { presencePill } from '../lib/motion';

const STATUS = {
    online: { dot: 'bg-[#00ff88] shadow-[0_0_6px_#00ff88]', label: '● Online', color: 'text-[#00ff88]' },
    idle: { dot: 'bg-yellow-400 shadow-[0_0_6px_#facc15]', label: '◐ Idle', color: 'text-yellow-400' },
    offline: { dot: 'bg-gray-600', label: '', color: 'text-gray-500' },
};

const PresencePill = ({ userId, username, showLabel = true, className = '' }) => {
    const { onlineUsers, idleUsers = [], lastSeen = {} } = useChatStore();

    const isOnline = onlineUsers.includes(userId);
    const isIdle = !isOnline && idleUsers.includes(userId);
    const key = isOnline ? 'online' : isIdle ? 'idle' : 'offline';
    const s = STATUS[key];

    const lastSeenAt = lastSeen[userId];
    const lastSeenLabel = lastSeenAt
        ? `Last seen ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`
        : 'Offline';

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <AnimatePresence mode="wait">
                <motion.span
                    key={key}
                    {...presencePill}
                    className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`}
                />
            </AnimatePresence>

            {showLabel && (
                <AnimatePresence mode="wait">
                    <motion.span
                        key={key + '-label'}
                        {...presencePill}
                        className={`text-xs ${s.color}`}
                    >
                        {isOnline ? '● Online' : isIdle ? '◐ Idle' : lastSeenLabel}
                    </motion.span>
                </AnimatePresence>
            )}
        </div>
    );
};

export default PresencePill;
