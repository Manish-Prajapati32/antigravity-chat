import { motion, AnimatePresence } from 'framer-motion';
import { scaleIn } from '../lib/motion';
import { Sparkles, X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const AISummaryModal = ({ isOpen, onClose, summary, isLoading }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!summary) return;
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        {...scaleIn}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="glass-panel rounded-2xl w-full max-w-lg shadow-2xl border border-[var(--color-glass-highlight)] pointer-events-auto overflow-hidden">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-[var(--color-glass-border)] flex items-center justify-between bg-black/20">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-[var(--color-neon-purple)]/15">
                                        <Sparkles className="w-4 h-4 text-[var(--color-neon-purple)]" />
                                    </div>
                                    <h3 className="font-semibold text-gray-200">AI Conversation Summary</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-hover"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-5 min-h-[120px]">
                                {isLoading ? (
                                    <div className="space-y-3">
                                        <div className="shimmer h-4 rounded-lg w-full" />
                                        <div className="shimmer h-4 rounded-lg w-4/5" />
                                        <div className="shimmer h-4 rounded-lg w-full" />
                                        <div className="shimmer h-4 rounded-lg w-3/5" />
                                        <div className="shimmer h-4 rounded-lg w-full" />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <span className="text-xs text-[var(--color-neon-purple)] bg-[var(--color-neon-purple)]/10 px-2 py-0.5 rounded-full font-medium">AI Generated</span>
                                            <span className="text-xs text-gray-500">Based on last 50 messages</span>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                            {summary || 'No content to summarize yet.'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {!isLoading && summary && (
                                <div className="px-5 pb-4 flex justify-end">
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 glass-input rounded-lg border border-[var(--color-glass-border)] hover:border-[var(--color-neon-cyan)]/40 text-gray-400 hover:text-white transition-hover"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-neon-green)]" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AISummaryModal;
