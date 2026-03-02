import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Zap } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden animate-ambient">
            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-1/3 -left-1/3 w-[50rem] h-[50rem] bg-[var(--color-neon-cyan)] rounded-full mix-blend-screen filter blur-[200px] opacity-10"></div>
                <div className="absolute -bottom-1/3 -right-1/3 w-[50rem] h-[50rem] bg-[var(--color-neon-purple)] rounded-full mix-blend-screen filter blur-[200px] opacity-10"></div>
            </div>

            <div className="text-center z-10 px-4">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="flex justify-center mb-8"
                >
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] flex items-center justify-center shadow-[0_0_40px_rgba(0,243,255,0.4)]">
                        <Zap className="w-10 h-10 text-white" />
                    </div>
                </motion.div>

                {/* 404 Text */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="text-[10rem] font-black leading-none tracking-tighter select-none"
                    style={{
                        background: 'linear-gradient(135deg, var(--color-neon-cyan), var(--color-neon-purple))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    404
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h2 className="text-2xl font-bold text-white mb-3">Page not found</h2>
                    <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                        Looks like you've drifted into the void. The page you're looking for doesn't exist.
                    </p>

                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 py-3.5 px-8 bg-gradient-to-r from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] text-white rounded-xl font-semibold tracking-wide hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)] group"
                    >
                        <Home className="w-5 h-5" />
                        <span>Back to Chat</span>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default NotFound;
