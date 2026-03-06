import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { Search, Trash2, Globe, Lock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { BASE_URL } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';

const AdminChats = () => {
    const { messages, messageMeta, isLoading, fetchMessages, deleteMessage } = useAdminStore();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [confirmId, setConfirmId] = useState(null);

    useEffect(() => { fetchMessages('', 1); }, []);

    const handleSearch = (val) => {
        setSearch(val);
        setPage(1);
        fetchMessages(val, 1);
    };

    const handleDelete = async () => {
        await deleteMessage(confirmId);
        setConfirmId(null);
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl md:text-2xl font-black text-white">Chat Messages</h1>
                <p className="text-sm text-gray-500 mt-0.5">{messageMeta.total} total messages</p>
            </div>

            {/* Search */}
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search message content…"
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 border border-[var(--color-glass-border)] focus:border-[var(--color-neon-cyan)] transition-colors"
                />
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[var(--color-neon-cyan)] animate-spin" />
                </div>
            ) : (
                <div className="space-y-2">
                    {messages.map(msg => (
                        <div
                            key={msg._id}
                            className="glass-panel p-3 md:p-4 rounded-xl border border-[var(--color-glass-border)] flex items-start gap-3 group hover:border-[var(--color-neon-cyan)]/20 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-neon-cyan)]/60 to-[var(--color-neon-purple)]/60 flex items-center justify-center shrink-0 overflow-hidden">
                                {msg.senderId?.avatar
                                    ? <img src={`${BASE_URL}${msg.senderId.avatar}`} className="w-full h-full object-cover" loading="lazy" alt="" />
                                    : <span className="text-white font-bold text-xs uppercase">{msg.senderId?.username?.charAt(0) || '?'}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <span className="text-xs font-semibold text-white">{msg.senderId?.username || 'Deleted User'}</span>
                                    {msg.receiverId
                                        ? <span className="text-[10px] text-[var(--color-neon-purple)] flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" />Private</span>
                                        : <span className="text-[10px] text-[var(--color-neon-cyan)] flex items-center gap-0.5"><Globe className="w-2.5 h-2.5" />Global</span>}
                                    <span className="text-[10px] text-gray-600 ml-auto">{msg.createdAt ? format(new Date(msg.createdAt), 'MMM d, HH:mm') : ''}</span>
                                </div>
                                {msg.content && <p className="text-sm text-gray-300 line-clamp-2">{msg.content}</p>}
                                {msg.fileUrl && (
                                    <span className="text-[10px] text-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/10 px-2 py-0.5 rounded border border-[var(--color-neon-cyan)]/20 mt-1 inline-block">
                                        📎 {msg.fileType} · {msg.fileName || 'file'}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setConfirmId(msg._id)}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/30 transition-all opacity-0 group-hover:opacity-100 shrink-0 touch-target flex items-center justify-center"
                                title="Delete message"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    {messages.length === 0 && <p className="text-center py-12 text-sm text-gray-600">No messages found</p>}
                </div>
            )}

            {/* Pagination */}
            {messageMeta.pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button disabled={page === 1} onClick={() => { const p = page - 1; setPage(p); fetchMessages(search, p); }} className="px-3 py-1.5 glass-input rounded-lg text-sm text-gray-400 disabled:opacity-40 hover:text-white transition-colors">← Prev</button>
                    <span className="text-xs text-gray-500">Page {page} of {messageMeta.pages}</span>
                    <button disabled={page === messageMeta.pages} onClick={() => { const p = page + 1; setPage(p); fetchMessages(search, p); }} className="px-3 py-1.5 glass-input rounded-lg text-sm text-gray-400 disabled:opacity-40 hover:text-white transition-colors">Next →</button>
                </div>
            )}

            {/* Confirm delete */}
            <AnimatePresence>
                {confirmId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-panel rounded-2xl p-6 max-w-sm w-full border border-red-500/30">
                            <p className="text-white text-sm mb-5">Delete this message? This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-xl text-sm font-semibold border border-red-500/30">Delete</button>
                                <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 glass-input text-gray-300 rounded-xl text-sm font-semibold">Cancel</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminChats;
