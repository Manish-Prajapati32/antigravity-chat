import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { Search, Trash2, Ban, CheckCircle, RotateCcw, Loader2, Shield, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { BASE_URL } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="glass-panel rounded-2xl p-6 max-w-sm w-full border border-red-500/30 shadow-2xl"
        >
            <p className="text-white text-sm mb-5">{message}</p>
            <div className="flex gap-3">
                <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-xl text-sm font-semibold transition-all border border-red-500/30">Confirm</button>
                <button onClick={onCancel} className="flex-1 py-2.5 glass-input hover:bg-white/10 text-gray-300 rounded-xl text-sm font-semibold transition-all">Cancel</button>
            </div>
        </motion.div>
    </motion.div>
);

const AdminUsers = () => {
    const { users, isLoading, fetchUsers, deleteUser, toggleBan, resetPassword } = useAdminStore();
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState(null); // { type, userId, username }
    const [tempPass, setTempPass] = useState(null);

    useEffect(() => { fetchUsers(); }, []);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        fetchUsers(e.target.value);
    };

    const handleDelete = async () => {
        await deleteUser(confirm.userId);
        setConfirm(null);
    };

    const handleBan = async () => {
        await toggleBan(confirm.userId);
        setConfirm(null);
    };

    const handleReset = async (id) => {
        const tp = await resetPassword(id);
        setTempPass(tp);
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl md:text-2xl font-black text-white">User Management</h1>
                <p className="text-sm text-gray-500 mt-0.5">{users.length} users found</p>
            </div>

            {/* Search */}
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={handleSearch}
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 border border-[var(--color-glass-border)] focus:border-[var(--color-neon-cyan)] transition-colors"
                />
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[var(--color-neon-cyan)] animate-spin" />
                </div>
            ) : (
                <div className="glass-panel rounded-2xl border border-[var(--color-glass-border)] overflow-hidden">
                    {/* Mobile: card list */}
                    <div className="md:hidden divide-y divide-[var(--color-glass-border)]">
                        {users.map(u => (
                            <div key={u._id} className="p-4 flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] flex items-center justify-center shrink-0 overflow-hidden">
                                    {u.avatar ? <img src={`${BASE_URL}${u.avatar}`} className="w-full h-full object-cover" loading="lazy" alt="" /> : <span className="text-white font-bold text-sm uppercase">{u.username.charAt(0)}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-white text-sm">{u.username}</span>
                                        {u.role === 'admin' && <span className="text-[10px] bg-[var(--color-neon-cyan)]/20 text-[var(--color-neon-cyan)] px-2 py-0.5 rounded-full border border-[var(--color-neon-cyan)]/30">Admin</span>}
                                        {u.isBanned && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">Banned</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                    <p className="text-[10px] text-gray-600 mt-0.5">Joined {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}</p>
                                    {u.role !== 'admin' && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            <button onClick={() => setConfirm({ type: 'ban', userId: u._id, username: u.username })} className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${u.isBanned ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                {u.isBanned ? 'Unban' : 'Ban'}
                                            </button>
                                            <button onClick={() => handleReset(u._id)} className="text-[11px] px-2.5 py-1 rounded-lg border bg-blue-500/10 text-blue-400 border-blue-500/20 transition-all">Reset PW</button>
                                            <button onClick={() => setConfirm({ type: 'delete', userId: u._id, username: u.username })} className="text-[11px] px-2.5 py-1 rounded-lg border bg-red-500/10 text-red-400 border-red-500/20 transition-all">Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: proper table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-glass-border)] text-left">
                                    <th className="px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">User</th>
                                    <th className="px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</th>
                                    <th className="px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">Joined</th>
                                    <th className="px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">Last Login</th>
                                    <th className="px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-glass-border)]">
                                {users.map(u => (
                                    <tr key={u._id} className="hover:bg-white/2 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] flex items-center justify-center overflow-hidden shrink-0">
                                                    {u.avatar ? <img src={`${BASE_URL}${u.avatar}`} className="w-full h-full object-cover" loading="lazy" alt="" /> : <span className="text-white font-bold text-xs uppercase">{u.username.charAt(0)}</span>}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{u.username}</p>
                                                    <p className="text-xs text-gray-500">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {u.role === 'admin' && <span className="text-[10px] bg-[var(--color-neon-cyan)]/20 text-[var(--color-neon-cyan)] px-2 py-0.5 rounded-full border border-[var(--color-neon-cyan)]/30 flex items-center gap-1"><Shield className="w-3 h-3" />Admin</span>}
                                                {u.isBanned && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">Banned</span>}
                                                {!u.isBanned && u.role !== 'admin' && <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">Active</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 text-xs">{u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}</td>
                                        <td className="px-5 py-3 text-gray-500 text-xs">{u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, HH:mm') : 'Never'}</td>
                                        <td className="px-5 py-3">
                                            {u.role !== 'admin' && (
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => setConfirm({ type: 'ban', userId: u._id, username: u.username })} className={`p-1.5 rounded-lg border transition-all ${u.isBanned ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'}`} title={u.isBanned ? 'Unban' : 'Ban'}>
                                                        {u.isBanned ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button onClick={() => handleReset(u._id)} className="p-1.5 rounded-lg border bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 transition-all" title="Reset Password">
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setConfirm({ type: 'delete', userId: u._id, username: u.username })} className="p-1.5 rounded-lg border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 transition-all" title="Delete User">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && <p className="text-center py-12 text-sm text-gray-600">No users found</p>}
                    </div>
                </div>
            )}

            {/* Confirm dialog */}
            <AnimatePresence>
                {confirm && (
                    confirm.type === 'delete'
                        ? <ConfirmDialog message={`Permanently delete "${confirm.username}"? This removes their account, messages, and media.`} onConfirm={handleDelete} onCancel={() => setConfirm(null)} />
                        : <ConfirmDialog message={`${confirm.type === 'ban' ? 'Ban' : 'Unban'} user "${confirm.username}"?`} onConfirm={handleBan} onCancel={() => setConfirm(null)} />
                )}
                {tempPass && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-panel rounded-2xl p-6 max-w-sm w-full border border-[var(--color-neon-cyan)]/30">
                            <p className="text-white text-sm mb-2">Temporary Password</p>
                            <p className="font-mono text-[var(--color-neon-cyan)] text-lg font-bold mb-4 glass-input p-3 rounded-xl text-center">{tempPass}</p>
                            <button onClick={() => setTempPass(null)} className="w-full py-2.5 bg-[var(--color-neon-cyan)]/20 text-[var(--color-neon-cyan)] rounded-xl text-sm font-semibold">Done</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminUsers;
