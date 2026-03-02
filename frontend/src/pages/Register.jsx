import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Loader2, Zap, ArrowRight } from 'lucide-react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register, isLoading, error } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await register({ username, email, password });
        if (success) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden animate-ambient py-10">
            {/* Deep background blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -right-1/2 w-[60rem] h-[60rem] bg-[var(--color-neon-purple)] rounded-full mix-blend-screen filter blur-[180px] opacity-10"></div>
                <div className="absolute -bottom-1/2 -left-1/2 w-[60rem] h-[60rem] bg-[var(--color-neon-cyan)] rounded-full mix-blend-screen filter blur-[180px] opacity-10"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="glass-panel p-8 md:p-10 rounded-3xl w-full max-w-md z-10 shadow-2xl"
            >
                {/* Logo area */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-neon-purple)] to-[var(--color-neon-cyan)] flex items-center justify-center shadow-[0_0_20px_rgba(181,0,255,0.4)] mb-4">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">
                        Antigravity<span className="neon-text-cyan">Chat</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Create your account and join the Nexus</p>
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
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-4 w-4 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                required
                                className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-gray-500" />
                            </div>
                            <input
                                type="email"
                                required
                                className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-gray-500" />
                            </div>
                            <input
                                type="password"
                                required
                                className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500"
                                placeholder="Create a strong password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 px-4 mt-2 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-neon-cyan)] text-white rounded-xl font-semibold tracking-wide hover:brightness-110 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(181,0,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                    <div className="relative flex justify-center"><span className="bg-transparent px-2 text-xs text-gray-500">Already have an account?</span></div>
                </div>

                <Link
                    to="/login"
                    className="block w-full py-3 px-4 text-center text-sm text-[var(--color-neon-purple)] border border-[var(--color-neon-purple)]/30 rounded-xl hover:bg-[var(--color-neon-purple)]/10 transition-all hover:shadow-[0_0_10px_rgba(181,0,255,0.15)]"
                >
                    Log in instead
                </Link>
            </motion.div>
        </div>
    );
};

export default Register;
