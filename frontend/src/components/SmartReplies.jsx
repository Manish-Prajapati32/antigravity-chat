import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/motion';
import { Sparkles } from 'lucide-react';

const SmartReplies = ({ suggestions = [], isLoading = false, onSelect }) => {
    if (!isLoading && suggestions.length === 0) return null;

    return (
        <div className="px-4 pb-2">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3 h-3 text-[var(--color-neon-purple)]" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Quick Replies</span>
            </div>

            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="flex flex-wrap gap-2"
            >
                {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="shimmer h-7 w-24 rounded-full"
                            style={{ width: `${60 + i * 20}px` }}
                        />
                    ))
                    : suggestions.map((s, i) => (
                        <motion.button
                            key={i}
                            variants={staggerItem}
                            onClick={() => onSelect(s)}
                            className="text-xs px-3 py-1.5 glass-input rounded-full border border-[var(--color-neon-purple)]/20 hover:border-[var(--color-neon-purple)]/60 text-gray-300 hover:text-white transition-hover hover:shadow-[0_0_12px_rgba(181,0,255,0.2)] truncate max-w-[200px]"
                        >
                            {s}
                        </motion.button>
                    ))}
            </motion.div>
        </div>
    );
};

export default SmartReplies;
