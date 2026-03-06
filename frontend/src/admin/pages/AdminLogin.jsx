import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Shield } from 'lucide-react';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error, user } = useAuthStore();
    const navigate = useNavigate();

    // If already logged in, redirect appropriate to role
    useEffect(() => {
        if (user) {
            if (user.role === 'admin') navigate('/admin/dashboard');
            else navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login({ email, password });
        if (success) {
            const currentUser = useAuthStore.getState().user;
            if (currentUser && currentUser.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-dark-bg)] animate-ambient">
            {/* Deep background blobs - adjusted colors for admin */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-[60rem] h-[60rem] bg-[var(--color-neon-cyan)] rounded-full mix-blend-screen filter blur-[180px] opacity-10"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-[60rem] h-[60rem] bg-indigo-600 rounded-full mix-blend-screen filter blur-[180px] opacity-10"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="glass-panel p-8 md:p-10 rounded-3xl w-full max-w-md z-10 shadow-[0_0_50px_rgba(0,243,255,0.05)] border border-[var(--color-neon-cyan)]/20"
            >
                {/* Logo area */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.4)] mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white mb-1">
                        Admin Portal
                    </h1>
                    <p className="text-[var(--color-neon-cyan)] text-sm font-semibold tracking-wide uppercase">Antigravity Chat</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-red-500/50 bg-red-500/10 text-red-200 p-3 rounded-xl mb-6 text-sm text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-[var(--color-neon-cyan)] uppercase tracking-wider">Admin Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-gray-500" />
                            </div>
                            <input
                                type="email"
                                required
                                className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 focus:border-[var(--color-neon-cyan)] transition-colors"
                                placeholder="admin@domain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-[var(--color-neon-cyan)] uppercase tracking-wider">Access Key</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-gray-500" />
                            </div>
                            <input
                                type="password"
                                required
                                className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 focus:border-[var(--color-neon-cyan)] transition-colors"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 px-4 mt-4 bg-gradient-to-r from-[var(--color-neon-cyan)] to-blue-600 text-white rounded-xl font-bold tracking-wide hover:brightness-110 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(0,243,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Authorize Access</span><Shield className="w-4 h-4 ml-1" /></>}
                    </button>

                    <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-xs text-gray-500 hover:text-white transition-colors"
                        >
                            Return to user login
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
