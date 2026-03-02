import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Send, FileUp, FileText, X, Pin, Smile, Check, CheckCheck, MoreVertical, Globe, Sparkles, Wand2, ChevronDown, Mic } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL, BASE_URL } from '../config';
import { groupMessages } from '../lib/groupMessages';
import { useSoundPlayer } from '../lib/sounds';
import { messagePop, scaleIn, fadeIn } from '../lib/motion';
import { summarizeConversation, getSmartReplies, rephraseMessage } from '../lib/aiService';
import PresencePill from '../components/PresencePill';
import SmartReplies from '../components/SmartReplies';
import AISummaryModal from '../components/AISummaryModal';

const EMOJI_LIST = ['👍', '❤️', '🔥', '😂', '😮', '🎉'];

const Chat = () => {
    const {
        messages,
        globalMessages,
        activeChat,
        users,
        onlineUsers,
        sendMessage,
        sendTypingStatus,
        sendIdleStatus,
        typingUsers,
        reactToMessage,
        pinMessage,
        markAsRead
    } = useChatStore();
    const { user: currentUser, token } = useAuthStore();
    const { soundEnabled } = useSettingsStore();
    const { playSend, playReceive, playPrivate } = useSoundPlayer(soundEnabled);


    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const [showReactionPickerFor, setShowReactionPickerFor] = useState(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState(null);
    // AI state
    const [showSummary, setShowSummary] = useState(false);
    const [summary, setSummary] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [smartSuggestions, setSmartSuggestions] = useState([]);
    const [smartLoading, setSmartLoading] = useState(false);
    const [rephraseLoading, setRephraseLoading] = useState(false);
    const [tone, setTone] = useState('casual');
    const [showTonePicker, setShowTonePicker] = useState(false);
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const idleTimerRef = useRef(null);

    // Guard: don't render Chat until user is loaded (prevents crash on initial load)
    if (!currentUser) return null;

    const activeMessages = activeChat === null ? globalMessages : messages;
    const targetUser = activeChat !== null ? users.find(u => u._id === activeChat) : null;
    const isTargetTyping = activeChat !== null ? typingUsers[activeChat] : typingUsers['global'];
    const pinnedMessages = activeMessages.filter(m => m.isPinned);

    // Generate consistent gradient for a user's initials avatar
    const getAvatarGradient = (username) => {
        const gradients = [
            'from-cyan-500 to-blue-600',
            'from-purple-500 to-pink-600',
            'from-emerald-500 to-teal-600',
            'from-orange-500 to-red-600',
            'from-indigo-500 to-purple-600',
            'from-rose-500 to-pink-600',
        ];
        const idx = username.charCodeAt(0) % gradients.length;
        return gradients[idx];
    };

    // Derived: grouped messages
    const groupedMessages = groupMessages(activeMessages, currentUser?._id);

    // ── Auto scroll and Mark as Read ────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        const container = scrollContainerRef.current;
        if (container) {
            const handleScroll = () => {
                const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
                setShowScrollBtn(distFromBottom > 300);
            };
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }

        if (activeMessages.length > 0) {
            const unread = activeMessages.filter(msg =>
                msg.senderId?._id !== currentUser?._id &&
                msg.receiverId === currentUser?._id &&
                (!msg.readBy || !msg.readBy.includes(currentUser?._id))
            );
            unread.forEach(msg => markAsRead(msg._id));
        }
    }, [activeMessages, isTargetTyping, currentUser?._id, markAsRead]);

    // ── Idle Detection (2 min) ───────────────────────────────
    useEffect(() => {
        const IDLE_TIMEOUT = 2 * 60 * 1000;
        const resetIdle = () => {
            sendIdleStatus(false);
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = setTimeout(() => sendIdleStatus(true), IDLE_TIMEOUT);
        };
        const events = ['mousemove', 'keydown', 'click', 'touchstart'];
        events.forEach(e => window.addEventListener(e, resetIdle));
        resetIdle();
        return () => {
            events.forEach(e => window.removeEventListener(e, resetIdle));
            clearTimeout(idleTimerRef.current);
        };
    }, [sendIdleStatus]);

    // ── Sound on new incoming message ────────────────────────
    const prevLengthRef = useRef(activeMessages.length);
    useEffect(() => {
        const newLen = activeMessages.length;
        if (newLen > prevLengthRef.current) {
            const latest = activeMessages[newLen - 1];
            const latestSenderId = latest?.senderId?._id || latest?.senderId;
            if (latestSenderId && latestSenderId !== currentUser?._id) {
                if (activeChat !== null) playPrivate();
                else playReceive();
            }
        }
        prevLengthRef.current = newLen;
    }, [activeMessages]);

    // ── Smart Replies (load when chat changes) ───────────────
    useEffect(() => {
        if (activeMessages.length === 0) { setSmartSuggestions([]); return; }
        const last = activeMessages[activeMessages.length - 1];
        const senderId = last?.senderId?._id || last?.senderId;
        if (senderId === currentUser?._id) { setSmartSuggestions([]); return; }
        setSmartLoading(true);
        getSmartReplies(last).then(s => {
            setSmartSuggestions(s);
            setSmartLoading(false);
        });
    }, [activeChat, activeMessages.length]);

    // ── AI Handlers ──────────────────────────────────────────
    const handleSummarize = async () => {
        setShowSummary(true);
        setSummaryLoading(true);
        const s = await summarizeConversation(activeMessages);
        setSummary(s);
        setSummaryLoading(false);
    };

    const handleRephrase = async () => {
        if (!content.trim()) return;
        setRephraseLoading(true);
        const rephrased = await rephraseMessage(content, tone);
        setContent(rephrased);
        setRephraseLoading(false);
    };


    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const processFile = (selectedFile) => {
        if (!selectedFile) return;

        // Check size limit (20MB)
        if (selectedFile.size > 20 * 1024 * 1024) {
            alert("File size exceeds 20MB limit.");
            return;
        }

        setFile(selectedFile);

        // Create preview for images
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setFilePreview(reader.result);
            reader.readAsDataURL(selectedFile);
        } else {
            setFilePreview(selectedFile.name);
        }
    };

    const handleTyping = (e) => {
        setContent(e.target.value);
        sendTypingStatus(e.target.value.length > 0);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        processFile(selectedFile);
    };

    const clearFile = () => {
        setFile(null);
        setFilePreview(null);
    };

    const submitMessage = async (e) => {
        e.preventDefault();
        if (!content.trim() && !file) return;

        let payload = {
            receiverId: activeChat,
            content: content.trim()
        };

        if (file) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await axios.post(`${API_URL}/upload`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });

                payload.fileUrl = res.data.fileUrl;
                payload.fileType = res.data.fileType;
                payload.fileName = res.data.fileName;
            } catch (err) {
                console.error('Upload failed', err);
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        sendMessage(payload);
        playSend();
        setContent('');
        setSmartSuggestions([]);
        clearFile();
        sendTypingStatus(false);
    };

    const renderMedia = (msg) => {
        if (!msg.fileUrl) return null;

        const url = `${BASE_URL}${msg.fileUrl}`;

        switch (msg.fileType) {
            case 'image':
                return (
                    <div
                        className="mt-2 rounded-xl overflow-hidden border border-[var(--color-glass-border)] max-w-sm cursor-zoom-in group/img relative"
                        onClick={() => setLightboxUrl(url)}
                    >
                        <img
                            src={url}
                            alt="Uploaded"
                            className="w-full h-auto max-h-64 object-cover transition-transform duration-300 group-hover/img:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/70 rounded-full p-2 text-white text-xs font-medium">
                                🔍 View
                            </div>
                        </div>
                    </div>
                );
            case 'video':
                return (
                    <div className="mt-2 rounded-xl overflow-hidden border border-[var(--color-glass-border)] max-w-sm shadow-lg">
                        <video src={url} controls className="w-full h-auto max-h-60 bg-black" />
                    </div>
                );
            case 'audio':
                return (
                    <div className="mt-2 glass-input p-3 rounded-xl max-w-xs">
                        <p className="text-xs text-gray-400 mb-2">{msg.fileName || 'Audio clip'}</p>
                        <audio src={url} controls className="w-full h-8" />
                    </div>
                );
            default:
                return (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-3 p-3 glass-input rounded-xl border border-[var(--color-glass-border)] hover:border-[var(--color-neon-cyan)]/40 transition-all group/doc"
                    >
                        <div className="p-2 bg-[var(--color-neon-cyan)]/10 rounded-lg group-hover/doc:bg-[var(--color-neon-cyan)]/20 transition-colors">
                            <FileText className="w-5 h-5 text-[var(--color-neon-cyan)]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate max-w-[180px]">{msg.fileName || 'Document'}</p>
                            <p className="text-[10px] text-gray-500">Click to download</p>
                        </div>
                    </a>
                );
        }
    };

    return (
        <div
            className={`flex flex-col h-full bg-[var(--color-dark-bg)] relative transition-colors ${isDragging ? 'bg-[var(--color-dark-surface)]/80' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Image Lightbox */}
            <AnimatePresence>
                {lightboxUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center cursor-zoom-out"
                        onClick={() => setLightboxUrl(null)}
                    >
                        <button
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/10 rounded-full transition-colors z-10"
                            onClick={() => setLightboxUrl(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            src={lightboxUrl}
                            alt="Full size"
                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {isDragging && (

                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm border-2 border-dashed border-[var(--color-neon-cyan)] rounded-xl m-4 pointer-events-none">
                    <div className="flex flex-col items-center p-8 bg-[var(--color-glass)] rounded-2xl shadow-2xl space-y-4">
                        <FileUp className="w-16 h-16 text-[var(--color-neon-cyan)] animate-bounce" />
                        <h3 className="text-2xl font-bold neon-text-cyan">Drop file to upload</h3>
                        <p className="text-gray-400">Supports images, videos, audio, and documents (up to 20MB)</p>
                    </div>
                </div>
            )}

            {/* AI Summary Modal */}
            <AISummaryModal
                isOpen={showSummary}
                onClose={() => setShowSummary(false)}
                summary={summary}
                isLoading={summaryLoading}
            />

            {/* Chat Header */}
            <div className="px-6 py-3 glass-panel border-b border-[var(--color-glass-border)] z-10 flex items-center justify-between">
                {activeChat === null ? (
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[var(--color-neon-cyan)]/20 text-[var(--color-neon-cyan)] shadow-[0_0_10px_rgba(0,243,255,0.3)]">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold neon-text-cyan leading-none">Global Nexus</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Public channel — visible to everyone</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br ${getAvatarGradient(targetUser?.username || 'U')} shadow-[0_0_10px_rgba(181,0,255,0.3)]`}>
                                {targetUser?.avatar ? (
                                    <img src={`${BASE_URL}${targetUser.avatar}`} alt={targetUser.username} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="uppercase font-bold text-white text-sm">{targetUser?.username?.charAt(0)}</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold neon-text-purple leading-none">{targetUser?.username}</h2>
                            <PresencePill userId={activeChat} username={targetUser?.username} />
                        </div>
                    </div>
                )}

                {/* AI Summarize Button */}
                {activeMessages.length >= 5 && (
                    <button
                        onClick={handleSummarize}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 glass-input rounded-full border border-[var(--color-neon-purple)]/20 hover:border-[var(--color-neon-purple)]/60 text-gray-400 hover:text-[var(--color-neon-purple)] transition-hover group"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:block">Summarize</span>
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative">

                {/* Empty Chat State */}
                {activeMessages.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-full text-center pb-20 select-none"
                    >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-neon-cyan)]/20 to-[var(--color-neon-purple)]/20 border border-[var(--color-glass-border)] flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(0,243,255,0.1)]">
                            <Globe className="w-10 h-10 text-[var(--color-neon-cyan)] opacity-60" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-300 mb-1">
                            {activeChat === null ? 'Welcome to Global Nexus' : `Start chatting with ${targetUser?.username}`}
                        </h3>
                        <p className="text-sm text-gray-500 max-w-xs">
                            {activeChat === null
                                ? 'This is the beginning of the public channel. Say hello!'
                                : 'Send your first message to kick things off.'}
                        </p>
                    </motion.div>
                )}

                {/* Pinned Messages Banner */}
                {pinnedMessages.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="sticky top-0 z-20 w-full mb-6"
                    >
                        <div className="glass-panel p-3 rounded-xl border-l-4 border-[var(--color-neon-cyan)] flex items-start gap-3 shadow-lg">
                            <Pin className="w-5 h-5 text-[var(--color-neon-cyan)] mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-[var(--color-neon-cyan)] uppercase tracking-wider mb-1">Pinned Messages ({pinnedMessages.length})</p>
                                <div className="text-sm text-gray-300 truncate">
                                    <span className="font-medium text-white">{pinnedMessages[pinnedMessages.length - 1].senderId?.username || 'User'}: </span>
                                    {pinnedMessages[pinnedMessages.length - 1].content || 'Media message'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <AnimatePresence initial={false}>
                    {activeMessages.map((msg, index) => {
                        const senderId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
                        const isMe = senderId === currentUser._id;
                        const senderName = msg.senderId?.username || msg.senderId?.email?.split('@')[0] || 'User';
                        const senderAvatar = msg.senderId?.avatar;
                        const isRead = activeChat !== null && isMe && msg.readBy && msg.readBy.includes(activeChat);

                        return (
                            <motion.div
                                key={msg._id || index}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className={`flex flex-col group relative ${isMe ? 'items-end' : 'items-start'}`}
                                onMouseEnter={() => setHoveredMessageId(msg._id)}
                                onMouseLeave={() => {
                                    setHoveredMessageId(null);
                                    if (showReactionPickerFor === msg._id) setShowReactionPickerFor(null);
                                }}
                            >
                                {/* Avatar + Name for other users */}
                                {!isMe && (
                                    <div className="flex items-center gap-2 mb-1 ml-1">
                                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                                            {senderAvatar ? (
                                                <img src={`${BASE_URL}${senderAvatar}`} alt={senderName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">{senderName.charAt(0)}</span>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-gray-300">{senderName}</span>
                                        <span className="text-[10px] opacity-50">{msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : format(new Date(), 'HH:mm')}</span>
                                    </div>
                                )}

                                <div className={`relative flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Message Bubble */}
                                    <div
                                        className={`relative p-3 md:p-4 rounded-2xl max-w-[85vw] md:max-w-[65vw] transition-all duration-200 ${isMe
                                            ? 'bubble-own rounded-tr-sm text-white'
                                            : 'bubble-other rounded-tl-sm text-gray-100'
                                            } hover:brightness-110`}
                                    >
                                        {msg.isPinned && (
                                            <div className="absolute -top-2 -right-2 bg-[var(--color-dark-surface)] rounded-full p-1 border border-[var(--color-neon-cyan)] shadow-[0_0_10px_rgba(0,243,255,0.4)] z-10">
                                                <Pin className="w-3 h-3 text-[var(--color-neon-cyan)]" />
                                            </div>
                                        )}
                                        {msg.content && <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                                        {renderMedia(msg)}

                                        <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            {isMe && (
                                                <span className="text-[10px] text-white/60">
                                                    {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : format(new Date(), 'HH:mm')}
                                                </span>
                                            )}
                                            {isMe && activeChat !== null && (
                                                <span className="ml-1">
                                                    {isRead ? (
                                                        <CheckCheck className="w-3.5 h-3.5 text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]" />
                                                    ) : (
                                                        <Check className="w-3.5 h-3.5 text-gray-400" />
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        {/* Reactions Display */}
                                        {msg.reactions && msg.reactions.length > 0 && (
                                            <div className={`flex flex-wrap gap-1 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                {msg.reactions.map((r, i) => {
                                                    const hasReacted = r.users.includes(currentUser._id);
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => reactToMessage(msg._id, r.emoji)}
                                                            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all ${hasReacted
                                                                ? 'bg-[var(--color-neon-cyan)]/20 border-[var(--color-neon-cyan)]/50 text-white shadow-[0_0_8px_rgba(0,243,255,0.2)]'
                                                                : 'bg-black/30 border-white/10 text-gray-300 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            <span>{r.emoji}</span>
                                                            <span className="opacity-80 font-medium">{r.users.length}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Interaction Action Menu (Hover) */}
                                    <div className={`flex items-center gap-1 transition-opacity duration-200 ${hoveredMessageId === msg._id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowReactionPickerFor(showReactionPickerFor === msg._id ? null : msg._id)}
                                                className="p-1.5 bg-[var(--color-dark-surface)]/80 backdrop-blur rounded-full text-gray-400 hover:text-[var(--color-neon-cyan)] border border-white/5 hover:border-[var(--color-neon-cyan)]/30 transition-all shadow-lg"
                                            >
                                                <Smile className="w-4 h-4" />
                                            </button>

                                            {/* Reaction Picker Popup */}
                                            <AnimatePresence>
                                                {showReactionPickerFor === msg._id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className={`absolute top-full mt-2 ${isMe ? 'right-0' : 'left-0'} z-30 glass-panel border border-[var(--color-glass-highlight)] p-2 rounded-2xl flex items-center gap-1 shadow-2xl`}
                                                    >
                                                        {EMOJI_LIST.map((emoji) => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => {
                                                                    reactToMessage(msg._id, emoji);
                                                                    setShowReactionPickerFor(null);
                                                                }}
                                                                className="text-xl hover:scale-125 transition-transform origin-bottom p-1.5"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <button
                                            onClick={() => pinMessage(msg._id)}
                                            className={`p-1.5 bg-[var(--color-dark-surface)]/80 backdrop-blur rounded-full transition-all shadow-lg border hover:border-[var(--color-neon-purple)]/50 ${msg.isPinned ? 'text-[var(--color-neon-purple)] border-[var(--color-neon-purple)]/30' : 'text-gray-400 border-white/5 hover:text-[var(--color-neon-purple)]'}`}
                                        >
                                            <Pin className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {isTargetTyping && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-start px-2"
                    >
                        <div className="glass-panel px-4 py-2.5 rounded-full flex items-center gap-3">
                            <span className="text-xs font-medium text-[var(--color-neon-cyan)]">{targetUser?.username || 'Someone'} is typing</span>
                            <div className="flex gap-1.5">
                                <span className="w-1.5 h-1.5 bg-[var(--color-neon-cyan)] rounded-full animate-bounce shadow-[0_0_5px_rgba(0,243,255,0.8)]" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-[var(--color-neon-cyan)] rounded-full animate-bounce shadow-[0_0_5px_rgba(0,243,255,0.8)]" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-[var(--color-neon-cyan)] rounded-full animate-bounce shadow-[0_0_5px_rgba(0,243,255,0.8)]" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Scroll-to-bottom button */}
            <AnimatePresence>
                {showScrollBtn && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        className="absolute bottom-24 right-6 z-30 p-3 rounded-full bg-gradient-to-br from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] text-white shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:brightness-110 transition-all"
                        title="Scroll to bottom"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Smart Replies + Input Area */}
            <div className="p-4 md:p-6 pt-0 bg-transparent z-10 w-full max-w-4xl mx-auto">

                {/* Smart Reply Suggestions */}
                <SmartReplies
                    suggestions={smartSuggestions}
                    isLoading={smartLoading}
                    onSelect={(s) => setContent(s)}
                />

                {filePreview && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-3 p-3 glass-panel rounded-xl inline-flex items-center gap-3 border shadow-2xl relative"
                    >
                        {file.type.startsWith('image/') ? (
                            <img src={filePreview} alt="Preview" className="h-16 w-16 object-cover rounded shadow-md" />
                        ) : (
                            <div className="h-12 w-12 flex items-center justify-center bg-black/40 rounded shadow-inner">
                                <FileText className="h-6 w-6 text-[var(--color-neon-cyan)]" />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white truncate max-w-[200px]">{file.name}</span>
                            <span className="text-xs text-[var(--color-neon-purple)]">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <button
                            onClick={clearFile}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-400 rounded-full p-1 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}

                <form onSubmit={submitMessage} className="flex relative items-end w-full">
                    <div className="w-full glass-input rounded-2xl flex items-end p-2 relative shadow-2xl">
                        {/* File Upload Button */}
                        <div className="relative shrink-0 mr-2">
                            <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt" />
                            <label htmlFor="file-upload" className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[var(--color-neon-cyan)] rounded-xl cursor-pointer transition-all block border border-transparent hover:border-white/10 flex items-center justify-center h-12 w-12" title="Attach media">
                                <FileUp className="w-5 h-5 flex-shrink-0" />
                            </label>
                        </div>

                        {/* Textarea */}
                        <textarea
                            value={content}
                            onChange={handleTyping}
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent border-none text-gray-200 focus:ring-0 resize-none overflow-y-auto min-h-[48px] max-h-32 py-3 px-2 outline-none placeholder-gray-500"
                            rows={1}
                            style={{ height: 'auto', outline: 'none', boxShadow: 'none' }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    submitMessage(e);
                                }
                            }}
                        />

                        {/* AI Rephrase Controls (shown when there's a draft) */}
                        <AnimatePresence>
                            {content.trim().length > 5 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex items-center gap-1 shrink-0 mr-1"
                                >
                                    {/* Tone Selector */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowTonePicker(p => !p)}
                                            className="p-2 text-gray-500 hover:text-[var(--color-neon-purple)] transition-hover text-[10px] font-medium uppercase tracking-wide"
                                            title="Select tone"
                                        >
                                            {tone}
                                        </button>
                                        <AnimatePresence>
                                            {showTonePicker && (
                                                <motion.div
                                                    {...scaleIn}
                                                    className="absolute bottom-full right-0 mb-2 glass-panel rounded-xl p-1 border border-[var(--color-glass-border)] shadow-2xl z-20 min-w-[110px]"
                                                >
                                                    {['casual', 'professional', 'friendly'].map(t => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            onClick={() => { setTone(t); setShowTonePicker(false); }}
                                                            className={`w-full text-left px-3 py-1.5 text-xs rounded-lg capitalize transition-hover ${tone === t ? 'text-[var(--color-neon-purple)] bg-[var(--color-neon-purple)]/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Rephrase Button */}
                                    <button
                                        type="button"
                                        onClick={handleRephrase}
                                        disabled={rephraseLoading}
                                        className="p-2 text-gray-500 hover:text-[var(--color-neon-purple)] transition-hover"
                                        title={`Rephrase as ${tone}`}
                                    >
                                        {rephraseLoading
                                            ? <span className="w-4 h-4 border border-[var(--color-neon-purple)]/50 border-t-[var(--color-neon-purple)] rounded-full animate-spin block" />
                                            : <Wand2 className="w-4 h-4" />}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={(!content.trim() && !file) || isUploading}
                            className={`p-3 rounded-xl shrink-0 ml-1 transition-all flex items-center justify-center h-12 w-12 overflow-hidden relative group ${(!content.trim() && !file) || isUploading
                                ? 'bg-black/30 text-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] text-white hover:brightness-110 shadow-[0_0_15px_rgba(0,243,255,0.3)]'
                                }`}
                        >
                            {isUploading
                                ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                : <Send className={`w-5 h-5 transition-transform duration-300 ${!((!content.trim() && !file) || isUploading) ? 'group-hover:translate-x-1 group-hover:-translate-y-1 group-active:scale-95' : ''}`} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Chat;
