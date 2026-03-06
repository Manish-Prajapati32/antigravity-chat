import { Globe, Users, Bell, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { BASE_URL } from '../config';

/**
 * MobileNavBar — persistent bottom tab bar, visible only on mobile (md:hidden).
 * Tabs: Global Nexus • DMs • Notifications • Profile
 */
const MobileNavBar = ({ onOpenSidebar, onOpenNotifications, pendingCount }) => {
    const { activeChat, setActiveChat, fetchGlobalMessages } = useChatStore();
    const { user } = useAuthStore();
    const location = useLocation();

    const isGlobalActive = activeChat === null && location.pathname === '/';
    const isDMsActive = activeChat !== null && location.pathname === '/';

    const handleGlobal = () => {
        setActiveChat(null);
        fetchGlobalMessages();
    };

    const tabs = [
        {
            id: 'global',
            label: 'Global',
            icon: Globe,
            active: isGlobalActive,
            onClick: handleGlobal,
            badge: null,
        },
        {
            id: 'dms',
            label: 'Messages',
            icon: Users,
            active: isDMsActive,
            onClick: onOpenSidebar,
            badge: null,
        },
        {
            id: 'notifications',
            label: 'Alerts',
            icon: Bell,
            active: false,
            onClick: onOpenNotifications,
            badge: pendingCount > 0 ? pendingCount : null,
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: null,
            active: location.pathname === '/profile',
            isProfileTab: true,
            href: '/profile',
            badge: null,
        },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {/* Frosted glass panel */}
            <div className="glass-panel border-t border-[var(--color-glass-border)] flex items-stretch shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
                {tabs.map((tab) =>
                    tab.href ? (
                        <Link
                            key={tab.id}
                            to={tab.href}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors
                                ${tab.active ? 'text-[var(--color-neon-purple)]' : 'text-gray-500 active:text-gray-300'}`}
                        >
                            {/* Active indicator pill */}
                            {tab.active && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--color-neon-purple)] rounded-full shadow-[0_0_8px_var(--color-neon-purple)]" />
                            )}
                            {/* Profile avatar */}
                            <div className={`w-6 h-6 rounded-full overflow-hidden ring-2 transition-all ${tab.active ? 'ring-[var(--color-neon-purple)]' : 'ring-white/10'
                                }`}>
                                {user?.avatar ? (
                                    <img src={`${BASE_URL}${user.avatar}`} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold ${tab.active ? 'bg-[var(--color-neon-purple)]/30 text-[var(--color-neon-purple)]' : 'bg-white/10 text-gray-400'
                                        }`}>
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <span className={`text-[10px] font-medium ${tab.active ? 'text-[var(--color-neon-purple)]' : 'text-gray-500'}`}>
                                {tab.label}
                            </span>
                        </Link>
                    ) : (
                        <button
                            key={tab.id}
                            onClick={tab.onClick}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors
                                ${tab.active ? 'text-[var(--color-neon-cyan)]' : 'text-gray-500 active:text-gray-300'}`}
                        >
                            {/* Active indicator pill */}
                            {tab.active && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--color-neon-cyan)] rounded-full shadow-[0_0_8px_var(--color-neon-cyan)]" />
                            )}
                            <div className="relative">
                                <tab.icon className={`w-5 h-5 transition-all ${tab.active ? 'drop-shadow-[0_0_6px_var(--color-neon-cyan)]' : ''}`} />
                                {tab.badge && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse">
                                        {tab.badge > 9 ? '9+' : tab.badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] font-medium ${tab.active ? 'text-[var(--color-neon-cyan)]' : 'text-gray-500'}`}>
                                {tab.label}
                            </span>
                        </button>
                    )
                )}
            </div>
        </nav>
    );
};

export default MobileNavBar;
