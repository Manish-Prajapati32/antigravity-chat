import { useState, useMemo } from 'react';
import { X, Image, Video, Mic, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../config';
import { format } from 'date-fns';

const TABS = [
    { key: 'image', label: 'Photos', icon: Image },
    { key: 'video', label: 'Videos', icon: Video },
    { key: 'audio', label: 'Audio', icon: Mic },
    { key: 'document', label: 'Files', icon: FileText },
];

const MediaGallery = ({ messages = [], isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('image');
    const [lightboxUrl, setLightboxUrl] = useState(null);

    const mediaMessages = useMemo(() =>
        messages.filter(m => m.fileUrl && m.fileType),
        [messages]
    );

    const byType = useMemo(() => {
        const map = { image: [], video: [], audio: [], document: [] };
        mediaMessages.forEach(m => {
            const t = m.fileType in map ? m.fileType : 'document';
            map[t].push(m);
        });
        return map;
    }, [mediaMessages]);

    const activeItems = byType[activeTab] || [];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="gallery-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                onClick={onClose}
            >
                <motion.div
                    key="gallery-panel"
                    initial={{ opacity: 0, y: 60, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 60, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                    className="w-full sm:max-w-2xl max-h-[90vh] glass-panel rounded-t-2xl sm:rounded-2xl border border-[var(--color-glass-highlight)] flex flex-col overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-glass-border)] shrink-0">
                        <h2 className="text-base font-bold text-white">Chat Media</h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 touch-target flex items-center justify-center"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[var(--color-glass-border)] px-2 shrink-0 overflow-x-auto">
                        {TABS.map(({ key, label, icon: Icon }) => {
                            const count = byType[key]?.length || 0;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === key
                                            ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]'
                                            : 'border-transparent text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {label}
                                    {count > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === key ? 'bg-[var(--color-neon-cyan)]/20 text-[var(--color-neon-cyan)]' : 'bg-white/10 text-gray-400'
                                            }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto overscroll-contain p-4 scroll-touch">
                        {activeItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-600 gap-2">
                                {TABS.find(t => t.key === activeTab) && (() => {
                                    const Icon = TABS.find(t => t.key === activeTab).icon;
                                    return <Icon className="w-10 h-10 opacity-20" />;
                                })()}
                                <p className="text-sm">No {activeTab === 'document' ? 'files' : activeTab + 's'} shared yet</p>
                            </div>
                        ) : (
                            <>
                                {/* Images — grid */}
                                {activeTab === 'image' && (
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {activeItems.map((msg, i) => {
                                            const url = `${BASE_URL}${msg.fileUrl}`;
                                            return (
                                                <button
                                                    key={msg._id || i}
                                                    onClick={() => setLightboxUrl(url)}
                                                    className="aspect-square rounded-lg overflow-hidden bg-black/30 border border-white/5 hover:border-[var(--color-neon-cyan)]/40 transition-all group"
                                                >
                                                    <img
                                                        src={url}
                                                        alt=""
                                                        loading="lazy"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Videos — grid */}
                                {activeTab === 'video' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {activeItems.map((msg, i) => {
                                            const url = `${BASE_URL}${msg.fileUrl}`;
                                            return (
                                                <div key={msg._id || i} className="rounded-xl overflow-hidden border border-[var(--color-glass-border)] bg-black">
                                                    <video
                                                        src={url}
                                                        controls
                                                        playsInline
                                                        preload="metadata"
                                                        className="w-full h-36 object-contain bg-black"
                                                    />
                                                    <p className="text-[10px] text-gray-500 px-2 py-1 truncate">
                                                        {msg.createdAt ? format(new Date(msg.createdAt), 'MMM d, HH:mm') : ''}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Audio — list */}
                                {activeTab === 'audio' && (
                                    <div className="space-y-2">
                                        {activeItems.map((msg, i) => {
                                            const url = `${BASE_URL}${msg.fileUrl}`;
                                            const isVoice = !msg.fileName || msg.fileName.startsWith('voice_');
                                            return (
                                                <div key={msg._id || i} className="flex items-center gap-3 p-3 glass-input rounded-xl border border-[var(--color-glass-border)]">
                                                    <div className="p-2 rounded-lg bg-[var(--color-neon-purple)]/10 shrink-0">
                                                        <Mic className="w-4 h-4 text-[var(--color-neon-purple)]" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-300 truncate mb-1">{isVoice ? 'Voice message' : (msg.fileName || 'Audio')}</p>
                                                        <audio src={url} controls className="w-full h-7" />
                                                    </div>
                                                    <span className="text-[10px] text-gray-600 shrink-0">
                                                        {msg.createdAt ? format(new Date(msg.createdAt), 'MMM d') : ''}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Documents — list */}
                                {activeTab === 'document' && (
                                    <div className="space-y-2">
                                        {activeItems.map((msg, i) => {
                                            const url = `${BASE_URL}${msg.fileUrl}`;
                                            return (
                                                <a
                                                    key={msg._id || i}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-3 glass-input rounded-xl border border-[var(--color-glass-border)] hover:border-[var(--color-neon-cyan)]/40 transition-all group"
                                                >
                                                    <div className="p-2 rounded-lg bg-[var(--color-neon-cyan)]/10 group-hover:bg-[var(--color-neon-cyan)]/20 transition-colors shrink-0">
                                                        <FileText className="w-4 h-4 text-[var(--color-neon-cyan)]" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-200 truncate">{msg.fileName || 'Document'}</p>
                                                        <p className="text-[10px] text-gray-500">
                                                            {msg.createdAt ? format(new Date(msg.createdAt), 'MMM d, yyyy') : ''} · Tap to download
                                                        </p>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-[var(--color-neon-cyan)] transition-colors shrink-0" />
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* Lightbox for images */}
            {lightboxUrl && (
                <motion.div
                    key="gallery-lightbox"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/10 rounded-full touch-target flex items-center justify-center z-10"
                        onClick={() => setLightboxUrl(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={lightboxUrl}
                        alt="Full size"
                        className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl"
                        onClick={e => e.stopPropagation()}
                        loading="lazy"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MediaGallery;
