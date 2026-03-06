import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

/**
 * VoiceRecorder
 * Props:
 *   onVoiceReady(blob, durationSeconds) — called when user stops recording and wants to send
 *   onCancel() — called when user discards recording
 */
const VoiceRecorder = ({ onVoiceReady, onCancel }) => {
    const [phase, setPhase] = useState('idle'); // idle | recording | preview
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState(null);
    const [blob, setBlob] = useState(null);
    const [hasPermission, setHasPermission] = useState(null);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const streamRef = useRef(null);

    // Determine best supported MIME type
    const getMimeType = () => {
        const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/mp4'];
        return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            setHasPermission(true);

            const mimeType = getMimeType();
            const options = mimeType ? { mimeType } : {};
            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const mType = mimeType || 'audio/webm';
                const audioBlob = new Blob(chunksRef.current, { type: mType });
                const url = URL.createObjectURL(audioBlob);
                setBlob(audioBlob);
                setAudioUrl(url);
                setPhase('preview');
                // Stop microphone tracks
                streamRef.current?.getTracks().forEach(t => t.stop());
            };

            recorder.start(100); // collect data every 100ms
            setDuration(0);
            setPhase('recording');

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        } catch (err) {
            console.error('Microphone access denied:', err);
            setHasPermission(false);
        }
    };

    const stopRecording = () => {
        clearInterval(timerRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const handleSend = () => {
        if (blob) {
            onVoiceReady(blob, duration);
            cleanup();
        }
    };

    const handleCancel = () => {
        stopImmediate();
        cleanup();
        onCancel();
    };

    const stopImmediate = () => {
        clearInterval(timerRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const cleanup = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setBlob(null);
        setDuration(0);
        setPhase('idle');
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearInterval(timerRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, []);

    return (
        <AnimatePresence mode="wait">
            {phase === 'idle' && (
                <motion.button
                    key="mic-btn"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    type="button"
                    onClick={startRecording}
                    className="p-2.5 bg-white/5 hover:bg-[var(--color-neon-cyan)]/10 text-gray-400 hover:text-[var(--color-neon-cyan)] rounded-xl cursor-pointer transition-all border border-transparent hover:border-[var(--color-neon-cyan)]/20 touch-target flex items-center justify-center shrink-0"
                    title="Record voice message"
                >
                    <Mic className="w-4 h-4" />
                </motion.button>
            )}

            {phase === 'recording' && (
                <motion.div
                    key="recording"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 px-3 py-2 glass-panel rounded-2xl border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                >
                    {/* Pulsing red dot */}
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse shrink-0" />
                    <span className="text-sm font-mono text-red-400 min-w-[3rem]">{formatDuration(duration)}</span>
                    {/* Stop → preview */}
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all touch-target flex items-center justify-center"
                        title="Stop recording"
                    >
                        <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                    {/* Cancel */}
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all touch-target flex items-center justify-center"
                        title="Cancel"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </motion.div>
            )}

            {phase === 'preview' && (
                <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 px-3 py-2 glass-panel rounded-2xl border border-[var(--color-neon-cyan)]/20"
                >
                    {/* Audio preview */}
                    <audio src={audioUrl} controls className="h-7 w-32 md:w-48" style={{ accentColor: 'var(--color-neon-cyan)' }} />
                    <span className="text-xs text-gray-500 font-mono shrink-0">{formatDuration(duration)}</span>
                    {/* Send */}
                    <button
                        type="button"
                        onClick={handleSend}
                        className="p-2 rounded-xl bg-gradient-to-r from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] text-white hover:brightness-110 transition-all shadow-[0_0_10px_rgba(0,243,255,0.3)] touch-target flex items-center justify-center shrink-0"
                        title="Send voice message"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                    {/* Discard */}
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="p-1.5 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all touch-target flex items-center justify-center shrink-0"
                        title="Discard"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VoiceRecorder;
