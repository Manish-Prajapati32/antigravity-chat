import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { LogOut, User as UserIcon, Bell, X, Check } from 'lucide-react';
import Sidebar from './Sidebar';
import { useEffect, useState } from 'react';
import { BASE_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const MainLayout = ({ children }) => {
    const { user, logout } = useAuthStore();
    const { connectSocket, disconnectSocket, fetchUsers, fetchGlobalMessages, fetchInvitations, invitations, acceptInvitation, rejectInvitation } = useChatStore();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Count pending incoming invitations
    const pendingCount = invitations.filter(inv => inv.status === 'pending' && inv.receiver._id === user?._id).length;

    useEffect(() => {
        connectSocket();
        fetchUsers();
        fetchGlobalMessages();
        fetchInvitations();

        return () => {
            disconnectSocket();
        };
    }, [connectSocket, disconnectSocket, fetchUsers, fetchGlobalMessages, fetchInvitations]);

    return (
        <div className="flex h-screen overflow-hidden animate-ambient">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <header className="h-16 glass-panel border-b border-[var(--color-glass-border)] flex items-center justify-between px-6 z-10 shadow-lg relative">
                    <h1 className="text-xl font-black tracking-tight neon-text-cyan flex items-center gap-2">
                        Antigravity<span className="text-white neon-text-purple">Chat</span>
                    </h1>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsNotificationsOpen(true)}
                            className="relative p-2 text-gray-400 hover:text-[var(--color-neon-cyan)] transition-colors rounded-full hover:bg-[var(--color-dark-surface)]"
                        >
                            <Bell className="w-5 h-5" />
                            {pendingCount > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444] border-2 border-[var(--color-dark-surface)] animate-pulse"></span>
                            )}
                        </button>

                        <Link
                            to="/profile"
                            className="flex items-center gap-3 bg-[var(--color-dark-surface)]/50 px-3 py-1.5 rounded-full border border-[var(--color-glass-border)] hover:bg-[var(--color-dark-surface)] hover:border-[var(--color-neon-purple)]/40 transition-all cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] p-[2px] shadow-[0_0_10px_rgba(0,243,255,0.3)] group-hover:shadow-[0_0_15px_rgba(181,0,255,0.5)] transition-all">
                                <div className="w-full h-full rounded-full bg-[var(--color-dark-surface)] flex items-center justify-center overflow-hidden">
                                    {user?.avatar ? (
                                        <img src={`${BASE_URL}${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold text-gray-200 uppercase">{user?.username?.charAt(0)}</span>
                                    )}
                                </div>
                            </div>
                            <span className="font-medium text-sm text-gray-200 group-hover:text-white transition-colors">{user?.username}</span>
                        </Link>

                        <button
                            onClick={logout}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors bg-[var(--color-dark-surface)] rounded-lg hover:bg-red-500/10"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Chat Area */}
                <main className="flex-1 relative overflow-hidden">
                    {children}
                </main>

                {/* Notification Center Modal */}
                <AnimatePresence>
                    {isNotificationsOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsNotificationsOpen(false)}
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40"
                            />
                            <motion.div
                                initial={{ opacity: 0, x: 100, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                className="absolute top-16 right-4 w-80 glass-panel rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[calc(100vh-5rem)] border border-[var(--color-glass-highlight)]"
                            >
                                <div className="p-4 border-b border-[var(--color-glass-border)] flex justify-between items-center bg-black/20">
                                    <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-[var(--color-neon-cyan)]" /> Notifications
                                    </h3>
                                    <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-400 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="overflow-y-auto p-2 space-y-2">
                                    {invitations.filter(inv => inv.status === 'pending' && inv.receiver._id === user?._id).length > 0 ? (
                                        invitations.filter(inv => inv.status === 'pending' && inv.receiver._id === user?._id).map(inv => (
                                            <div key={inv._id} className="p-3 bg-[var(--color-dark-surface)]/80 rounded-lg border border-white/5 flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0">
                                                        {inv.sender.avatar ? (
                                                            <img src={`${BASE_URL}${inv.sender.avatar}`} alt={inv.sender.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">{inv.sender.username.charAt(0)}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-200"><span className="text-[var(--color-neon-cyan)]">{inv.sender.username}</span> wants to connect</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full mt-1">
                                                    <button onClick={() => acceptInvitation(inv._id)} className="flex-1 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 rounded text-xs font-semibold flex items-center justify-center gap-1 transition">
                                                        <Check className="w-3 h-3" /> Accept
                                                    </button>
                                                    <button onClick={() => rejectInvitation(inv._id)} className="flex-1 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded text-xs font-semibold flex items-center justify-center gap-1 transition">
                                                        <X className="w-3 h-3" /> Decline
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center text-gray-500 flex flex-col items-center gap-2">
                                            <Bell className="w-8 h-8 opacity-20" />
                                            <p className="text-sm">You are all caught up!</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MainLayout;
