import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { Trash2, Loader2, Image, Video, Mic, FileText } from 'lucide-react';
import { BASE_URL } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const TABS = [
    { key: '', label: 'All' },
    { key: 'image', label: 'Images', icon: Image },
    { key: 'video', label: 'Videos', icon: Video },
    { key: 'audio', label: 'Audio', icon: Mic },
    { key: 'document', label: 'Files', icon: FileText },
];

const AdminMedia = () => {
    const { media, isLoading, fetchMedia, deleteMedia } = useAdminStore();
    const [typeFilter, setTypeFilter] = useState('');
    const [confirmId, setConfirmId] = useState(null);
    const [lightbox, setLightbox] = useState(null);

    useEffect(() => { fetchMedia(typeFilter); }, [typeFilter]);

    const handleDelete = async () => {
        await deleteMedia(confirmId);
        setConfirmId(null);
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl md:text-2xl font-black text-white">Media Manager</h1>
                <p className="text-sm text-gray-500 mt-0.5">{media.length} files</p>
            </div>

            {/* Type filter tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                {TABS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setTypeFilter(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${typeFilter === key
                                ? 'bg-[var(--color-neon-cyan)]/20 text-[var(--color-neon-cyan)] border border-[var(--color-neon-cyan)]/40'
                                : 'glass-input text-gray-400 hover:text-gray-200 border border-[var(--color-glass-border)]'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[var(--color-neon-cyan)] animate-spin" />
                </div>
            ) : (
                <>
                    {/* Image/Video Grid */}
                    {(typeFilter === '' || typeFilter === 'image') && media.filter(m => m.fileType === 'image').length > 0 && (
                        <div>
                            {typeFilter === '' && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Images</h3>}
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {media.filter(m => m.fileType === 'image').map(msg => (
                                    <div key={msg._id} className="relative group aspect-square rounded-xl overflow-hidden border border-[var(--color-glass-border)]">
                                        <img
                                            src={`${BASE_URL}${msg.fileUrl}`}
                                            alt=""
                                            loading="lazy"
                                            className="w-full h-full object-cover cursor-pointer"
                                            onClick={() => setLightbox(`${BASE_URL}${msg.fileUrl}`)}
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                            <button onClick={() => setConfirmId(msg._id)} className="p-1.5 bg-red-500/80 text-white rounded-lg hover:bg-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-black/60 text-[9px] text-gray-300 truncate hidden group-hover:block">
                                            {msg.senderId?.username}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Video Grid */}
                    {(typeFilter === '' || typeFilter === 'video') && media.filter(m => m.fileType === 'video').length > 0 && (
                        <div>
                            {typeFilter === '' && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">Videos</h3>}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {media.filter(m => m.fileType === 'video').map(msg => (
                                    <div key={msg._id} className="relative group rounded-xl overflow-hidden border border-[var(--color-glass-border)] bg-black">
                                        <video src={`${BASE_URL}${msg.fileUrl}`} className="w-full h-28 object-contain" preload="metadata" playsInline />
                                        <div className="p-2 flex items-center justify-between">
                                            <span className="text-[10px] text-gray-500">{msg.senderId?.username} · {msg.createdAt ? format(new Date(msg.createdAt), 'MMM d') : ''}</span>
                                            <button onClick={() => setConfirmId(msg._id)} className="p-1 bg-red-500/20 text-red-400 rounded border border-red-500/20 hover:bg-red-500/40"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Audio + Documents List */}
                    {(typeFilter === '' || typeFilter === 'audio' || typeFilter === 'document') && (
                        <div className="space-y-2">
                            {typeFilter === '' && media.filter(m => m.fileType === 'audio' || m.fileType === 'document').length > 0 && (
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">Audio & Files</h3>
                            )}
                            {media.filter(m => (typeFilter === '' ? (m.fileType === 'audio' || m.fileType === 'document') : m.fileType === typeFilter)).map(msg => (
                                <div key={msg._id} className="glass-panel p-3 rounded-xl border border-[var(--color-glass-border)] flex items-center gap-3 group">
                                    <div className="p-2 rounded-lg bg-[var(--color-neon-purple)]/10 shrink-0">
                                        {msg.fileType === 'audio' ? <Mic className="w-4 h-4 text-[var(--color-neon-purple)]" /> : <FileText className="w-4 h-4 text-[var(--color-neon-cyan)]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-300 truncate">{msg.fileName || (msg.fileType === 'audio' ? 'Audio clip' : 'Document')}</p>
                                        <p className="text-[10px] text-gray-600">{msg.senderId?.username} · {msg.createdAt ? format(new Date(msg.createdAt), 'MMM d, HH:mm') : ''}</p>
                                    </div>
                                    {msg.fileType === 'audio' && <audio src={`${BASE_URL}${msg.fileUrl}`} controls className="h-7 w-28 md:w-40" />}
                                    <button onClick={() => setConfirmId(msg._id)} className="p-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/30 transition-all opacity-0 group-hover:opacity-100 shrink-0">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {media.length === 0 && <p className="text-center py-12 text-sm text-gray-600">No media files found</p>}
                </>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(null)}>
                        <img src={lightbox} alt="Full size" className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl" loading="lazy" />
                    </motion.div>
                )}
                {confirmId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-panel rounded-2xl p-6 max-w-sm w-full border border-red-500/30">
                            <p className="text-white text-sm mb-5">Permanently delete this file and its message?</p>
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

export default AdminMedia;
