import { useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { Megaphone, Send, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSettings = () => {
    const { broadcast } = useAdminStore();
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState(null); // 'success' | 'error'
    const [isSending, setIsSending] = useState(false);

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        setIsSending(true);
        try {
            await broadcast(message);
            setMessage('');
            setStatus('success');
            setTimeout(() => setStatus(null), 4000);
        } catch {
            setStatus('error');
            setTimeout(() => setStatus(null), 4000);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-xl md:text-2xl font-black text-white">Settings</h1>
                <p className="text-sm text-gray-500 mt-0.5">Admin tools and configurations</p>
            </div>

            {/* Broadcast panel */}
            <div className="glass-panel p-5 md:p-6 rounded-2xl border border-[var(--color-glass-border)]">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-[var(--color-neon-cyan)]/10 border border-[var(--color-neon-cyan)]/20">
                        <Megaphone className="w-5 h-5 text-[var(--color-neon-cyan)]" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white">Broadcast Message</h2>
                        <p className="text-xs text-gray-500">Send an announcement to all connected users in real-time</p>
                    </div>
                </div>

                <form onSubmit={handleBroadcast} className="space-y-3">
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Type your announcement…"
                        rows={4}
                        maxLength={500}
                        className="glass-input w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 resize-none border border-[var(--color-glass-border)] focus:border-[var(--color-neon-cyan)] transition-colors"
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-600">{message.length}/500</span>
                        <button
                            type="submit"
                            disabled={!message.trim() || isSending}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                        >
                            <Send className="w-4 h-4" />
                            {isSending ? 'Sending…' : 'Broadcast'}
                        </button>
                    </div>
                </form>

                <AnimatePresence>
                    {status === 'success' && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-xl">
                            <CheckCircle className="w-4 h-4 shrink-0" /> Broadcast sent to all connected users.
                        </motion.div>
                    )}
                    {status === 'error' && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                            <AlertCircle className="w-4 h-4 shrink-0" /> Failed to send broadcast. Try again.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Info panel */}
            <div className="glass-panel p-5 rounded-2xl border border-[var(--color-glass-border)]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-[var(--color-neon-purple)]/10 border border-[var(--color-neon-purple)]/20">
                        <Info className="w-5 h-5 text-[var(--color-neon-purple)]" />
                    </div>
                    <h2 className="text-sm font-bold text-white">System Info</h2>
                </div>
                <dl className="space-y-2 text-sm">
                    {[
                        ['App', 'Antigravity Chat'],
                        ['Stack', 'React · Node.js · MongoDB · Socket.IO'],
                        ['Theme', 'Dark Neon / Glassmorphism'],
                    ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 py-1.5 border-b border-[var(--color-glass-border)] last:border-0">
                            <dt className="text-gray-500 text-xs">{k}</dt>
                            <dd className="text-gray-200 text-xs text-right">{v}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
};

export default AdminSettings;
