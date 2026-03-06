import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
    LayoutDashboard, Users, MessageSquare, Image, ClipboardList, Settings,
    LogOut, Menu, X, Shield, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/chats', label: 'Messages', icon: MessageSquare },
    { to: '/admin/media', label: 'Media', icon: Image },
    { to: '/admin/logs', label: 'Activity Logs', icon: ClipboardList },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const AdminLayout = ({ children }) => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-[var(--color-glass-border)]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--color-neon-cyan)]/30 to-[var(--color-neon-purple)]/30 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                        <Shield className="w-5 h-5 text-[var(--color-neon-cyan)]" />
                    </div>
                    <div>
                        <span className="text-sm font-black tracking-tight text-white">Admin</span>
                        <span className="neon-text-cyan text-sm font-black"> Panel</span>
                        <p className="text-[10px] text-gray-500 leading-none">Antigravity Chat</p>
                    </div>
                </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                ? 'bg-gradient-to-r from-[var(--color-neon-cyan)]/20 to-transparent border border-[var(--color-neon-cyan)]/40 text-white shadow-[0_0_10px_rgba(0,243,255,0.1)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`
                        }
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* User Info + Logout */}
            <div className="p-3 border-t border-[var(--color-glass-border)]">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white uppercase">{user?.username?.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{user?.displayName || user?.username}</p>
                        <p className="text-[10px] text-[var(--color-neon-cyan)]">Administrator</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen-mobile bg-[var(--color-dark-bg)] overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-60 glass-panel border-r border-[var(--color-glass-border)] shrink-0">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Drawer */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            key="drawer"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            className="fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-[var(--color-glass-border)] md:hidden flex flex-col"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile top bar */}
                <div className="md:hidden flex items-center gap-3 px-4 py-3 glass-panel border-b border-[var(--color-glass-border)] shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 touch-target flex items-center justify-center"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[var(--color-neon-cyan)]" />
                        <span className="text-sm font-bold text-white">Admin Panel</span>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto overscroll-contain scroll-touch p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
