import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { Globe, Users, MessageSquare, UserPlus, Check, X, Clock, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BASE_URL } from '../config';
import { useState } from 'react';
import PresencePill from './PresencePill';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Sidebar = () => {
    const {
        users,
        invitations,
        activeChat,
        setActiveChat,
        fetchPrivateMessages,
        onlineUsers,
        sendInvitation,
        acceptInvitation,
        rejectInvitation,
        unreadMessages
    } = useChatStore();

    const { user: currentUser } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');

    const handleGlobalChat = () => {
        setActiveChat(null);
        useChatStore.getState().fetchGlobalMessages();
    };

    const handlePrivateChat = (userId) => {
        setActiveChat(userId);
        fetchPrivateMessages(userId);
    };

    // Derived states
    const acceptedUserIds = new Set();
    const pendingIncoming = [];
    const pendingOutgoing = new Set();

    invitations.forEach(inv => {
        if (inv.status === 'accepted') {
            const friendId = inv.sender._id === currentUser._id ? inv.receiver._id : inv.sender._id;
            acceptedUserIds.add(friendId);
        } else if (inv.status === 'pending') {
            if (inv.receiver._id === currentUser._id) {
                pendingIncoming.push(inv);
            } else {
                pendingOutgoing.add(inv.receiver._id);
            }
        }
    });

    const acceptedUsers = users.filter(u => acceptedUserIds.has(u._id) && u.username.toLowerCase().includes(searchQuery.toLowerCase()));
    const discoverUsers = users.filter(u =>
        !acceptedUserIds.has(u._id) &&
        !pendingIncoming.find(inv => inv.sender._id === u._id) &&
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-80 h-full glass-panel border-r border-[var(--color-glass-border)] flex flex-col z-20 transition-all duration-300 shadow-2xl relative">
            {/* Decorative edge highlight */}
            <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[var(--color-glass-highlight)] to-transparent pointer-events-none"></div>

            <div className="p-4 border-b border-[var(--color-glass-border)] bg-black/20">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Chat Rooms
                    </h2>
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400 group-focus-within:text-[var(--color-neon-cyan)] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-black/30 border border-[var(--color-glass-border)] rounded-lg focus:outline-none focus:border-[var(--color-neon-cyan)] focus:ring-1 focus:ring-[var(--color-neon-cyan)] transition-all text-sm placeholder-gray-500 shadow-inner"
                    />
                </div>
            </div>

            <div className="p-2">
                <button
                    onClick={handleGlobalChat}
                    className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left border relative hover:-translate-y-0.5",
                        activeChat === null
                            ? "bg-gradient-to-r from-[var(--color-neon-cyan)]/20 to-transparent border-[var(--color-neon-cyan)]/50 text-white shadow-[0_0_15px_rgba(0,243,255,0.15)]"
                            : "bg-[var(--color-dark-surface)]/50 border-transparent hover:bg-[var(--color-dark-surface)] text-gray-400 hover:text-gray-200"
                    )}
                >
                    <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        activeChat === null ? "bg-[var(--color-neon-cyan)]/30 text-[var(--color-neon-cyan)] shadow-[0_0_10px_rgba(0,243,255,0.3)]" : "bg-black/40 text-gray-500"
                    )}>
                        <Globe className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Global Nexus</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pb-4">

                {/* Pending Incoming Invitations */}
                {pendingIncoming.length > 0 && (
                    <div>
                        <div className="px-4 py-2 border-y border-[var(--color-glass-border)] bg-[#1e1e28]/50">
                            <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Pending Invites ({pendingIncoming.length})
                            </h2>
                        </div>
                        <div className="p-2 space-y-1">
                            {pendingIncoming.map((inv) => (
                                <div key={inv._id} className="w-full flex items-center justify-between p-2 rounded-lg bg-[var(--color-dark-surface)] border border-purple-500/20">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
                                            {inv.sender.avatar ? (
                                                <img src={`${BASE_URL}${inv.sender.avatar}`} alt={inv.sender.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="uppercase font-bold text-gray-400 text-xs">{inv.sender.username.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="truncate text-sm font-medium text-gray-300">
                                            {inv.sender.username}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => acceptInvitation(inv._id)} className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 transition">
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => rejectInvitation(inv._id)} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Direct Messages */}
                <div>
                    <div className="px-4 py-2 border-y border-[var(--color-glass-border)] bg-[#1e1e28]/50 mt-2">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Direct Messages
                        </h2>
                    </div>
                    <div className="p-2 space-y-1">
                        {acceptedUsers.map((u) => {
                            const isOnline = onlineUsers.includes(u._id);
                            const isActive = activeChat === u._id;
                            const unreadCount = unreadMessages[u._id] || 0;

                            return (
                                <button
                                    key={u._id}
                                    onClick={() => handlePrivateChat(u._id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 relative group border hover:-translate-y-0.5",
                                        isActive
                                            ? "bg-gradient-to-r from-[var(--color-neon-purple)]/20 to-transparent border-[var(--color-neon-purple)]/50 shadow-[0_0_15px_rgba(181,0,255,0.15)]"
                                            : "bg-transparent hover:bg-[var(--color-dark-surface)]/80 border-transparent"
                                    )}
                                >
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                            {u.avatar ? (
                                                <img src={`${BASE_URL}${u.avatar}`} alt={u.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="uppercase font-bold text-gray-400">{u.username.charAt(0)}</span>
                                            )}
                                        </div>
                                        {isOnline && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00ff88] rounded-full shadow-[0_0_8px_#00ff88] border-2 border-[var(--color-dark-surface)] transition-all"></span>
                                        )}
                                    </div>

                                    <div className="flex-1 text-left truncate">
                                        <div className={cn("font-medium truncate flex items-center justify-between", isActive ? "text-white" : "text-gray-300 group-hover:text-white")}>
                                            <span>{u.username}</span>
                                            {unreadCount > 0 && (
                                                <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full ml-2 shadow-[0_0_8px_#ef4444]">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs truncate flex items-center justify-between">
                                            <PresencePill userId={u._id} username={u.username} className="flex-1" />
                                            {unreadCount > 0 && (
                                                <span className="text-red-400 font-medium">New message{unreadCount > 1 ? 's' : ''}</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}

                        {acceptedUsers.length === 0 && (
                            <div className="text-center p-4 text-sm text-gray-500">
                                No contacts available
                            </div>
                        )}
                    </div>
                </div>

                {/* Discover Users */}
                {discoverUsers.length > 0 && (
                    <div>
                        <div className="px-4 py-2 border-y border-[var(--color-glass-border)] bg-[#1e1e28]/50 mt-2">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Discover Users
                            </h2>
                        </div>
                        <div className="p-2 space-y-1">
                            {discoverUsers.map((u) => {
                                const isPendingOrigin = pendingOutgoing.has(u._id);
                                const isOnline = onlineUsers.includes(u._id);

                                return (
                                    <div key={u._id} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-dark-surface)] transition-all">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="relative shrink-0">
                                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${u.username.charCodeAt(0) % 2 === 0 ? 'from-[var(--color-neon-cyan)] to-blue-700' : 'from-[var(--color-neon-purple)] to-pink-700'} flex items-center justify-center overflow-hidden shadow-md`}>
                                                    {u.avatar ? (
                                                        <img src={`${BASE_URL}${u.avatar}`} alt={u.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="uppercase font-bold text-white text-xs">{u.username.charAt(0)}</span>
                                                    )}
                                                </div>
                                                {isOnline && (
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00ff88] rounded-full shadow-[0_0_6px_#00ff88] border-2 border-[var(--color-dark-bg)]"></span>
                                                )}
                                            </div>
                                            <div className="truncate text-sm font-medium text-gray-300 group-hover:text-white">
                                                {u.username}
                                            </div>
                                        </div>

                                        <div className="shrink-0 ml-2">
                                            {isPendingOrigin ? (
                                                <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">Sent</span>
                                            ) : (
                                                <button
                                                    onClick={() => sendInvitation(u._id)}
                                                    className="text-xs text-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/10 hover:bg-[var(--color-neon-cyan)]/20 px-2 py-1 rounded border border-[var(--color-neon-cyan)]/20 transition-colors"
                                                >
                                                    Invite
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
