import { useState, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Camera, Save, ArrowLeft, Loader2, Check, Zap, Shield, Volume2, VolumeX } from 'lucide-react';
import { BASE_URL, API_URL } from '../config';
import axios from 'axios';

const Profile = () => {
    const { user, token, updateProfile } = useAuthStore();
    const { soundEnabled, setSoundEnabled } = useSettingsStore();
    const navigate = useNavigate();

    const [username, setUsername] = useState(user?.username || '');
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            let avatarUrl = user?.avatar;

            if (avatarFile) {
                const formData = new FormData();
                formData.append('file', avatarFile);
                const uploadRes = await axios.post(`${API_URL}/upload`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });
                avatarUrl = uploadRes.data.fileUrl;
            }

            await updateProfile({ username, avatar: avatarUrl });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const currentAvatar = avatarPreview || (user?.avatar ? `${BASE_URL}${user.avatar}` : null);

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden animate-ambient py-10">
            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-[60rem] h-[60rem] bg-[var(--color-neon-cyan)] rounded-full mix-blend-screen filter blur-[180px] opacity-10"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-[60rem] h-[60rem] bg-[var(--color-neon-purple)] rounded-full mix-blend-screen filter blur-[180px] opacity-10"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="glass-panel p-8 md:p-10 rounded-3xl w-full max-w-lg z-10 shadow-2xl"
            >
                {/* Back button */}
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-[var(--color-neon-cyan)] transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Chat
                </button>

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4 group">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] p-[3px] shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                            <div className="w-full h-full rounded-full bg-[var(--color-dark-surface)] flex items-center justify-center overflow-hidden">
                                {currentAvatar ? (
                                    <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-black text-gray-300 uppercase">
                                        {user?.username?.charAt(0)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-2 bg-[var(--color-neon-purple)] rounded-full shadow-[0_0_10px_rgba(181,0,255,0.5)] hover:brightness-110 transition-all"
                        >
                            <Camera className="w-4 h-4 text-white" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">
                        Antigravity<span className="neon-text-purple">Chat</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Edit your profile</p>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="glass-input p-3 rounded-xl flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[var(--color-neon-cyan)]/15">
                            <Shield className="w-4 h-4 text-[var(--color-neon-cyan)]" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Status</p>
                            <p className="text-sm font-semibold text-white">Active</p>
                        </div>
                    </div>
                    <div className="glass-input p-3 rounded-xl flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[var(--color-neon-purple)]/15">
                            <Zap className="w-4 h-4 text-[var(--color-neon-purple)]" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Account</p>
                            <p className="text-sm font-semibold text-white">Member</p>
                        </div>
                    </div>
                </div>

                {/* Error / Success */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="border border-red-500/50 bg-red-500/10 text-red-200 p-3 rounded-xl mb-5 text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="border border-emerald-500/50 bg-emerald-500/10 text-emerald-200 p-3 rounded-xl mb-5 text-sm text-center flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" /> Profile updated successfully!
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-4 w-4 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                required
                                className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500"
                                placeholder="Your display name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Email (read-only) */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-gray-500" />
                            </div>
                            <input
                                type="email"
                                disabled
                                className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-gray-500 cursor-not-allowed opacity-60"
                                value={user?.email || ''}
                            />
                        </div>
                        <p className="text-[11px] text-gray-600">Email cannot be changed</p>
                    </div>

                    {/* Sound Effects Toggle */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preferences</label>
                        <div className="glass-input p-3 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {soundEnabled
                                    ? <Volume2 className="w-4 h-4 text-[var(--color-neon-cyan)]" />
                                    : <VolumeX className="w-4 h-4 text-gray-500" />}
                                <div>
                                    <p className="text-sm text-white font-medium">Sound Effects</p>
                                    <p className="text-[11px] text-gray-500">Send / receive sounds</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${soundEnabled
                                        ? 'bg-[var(--color-neon-purple)] shadow-[0_0_10px_rgba(181,0,255,0.4)]'
                                        : 'bg-gray-700'
                                    }`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${soundEnabled ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>
                    </div>

                    {/* Save button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 px-4 mt-2 bg-gradient-to-r from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] text-white rounded-xl font-semibold tracking-wide hover:brightness-110 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(0,243,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <><Save className="w-4 h-4" /><span>Save Changes</span></>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Profile;
