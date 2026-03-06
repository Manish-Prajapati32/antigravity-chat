import { useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { Loader2, UserX, Trash2, Shield, Megaphone, Key, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

const ACTION_ICON = {
    USER_DELETED: Trash2,
    USER_BANNED: UserX,
    USER_UNBANNED: Shield,
    MESSAGE_DELETED: Trash2,
    FILE_DELETED: Trash2,
    USER_BROADCAST: Megaphone,
    PASSWORD_RESET: Key,
};

const ACTION_COLOR = {
    USER_DELETED: 'text-red-400 bg-red-500/10 border-red-500/20',
    USER_BANNED: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    USER_UNBANNED: 'text-green-400 bg-green-500/10 border-green-500/20',
    MESSAGE_DELETED: 'text-red-400 bg-red-500/10 border-red-500/20',
    FILE_DELETED: 'text-red-400 bg-red-500/10 border-red-500/20',
    USER_BROADCAST: 'text-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/10 border-[var(--color-neon-cyan)]/20',
    PASSWORD_RESET: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

const AdminLogs = () => {
    const { logs, fetchLogs } = useAdminStore();

    useEffect(() => { fetchLogs(); }, []);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-white">Activity Logs</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Last {logs.length} admin actions</p>
                </div>
                <button onClick={fetchLogs} className="p-2 glass-input rounded-xl text-gray-400 hover:text-white transition-colors border border-[var(--color-glass-border)] touch-target flex items-center justify-center">
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            {logs.length === 0 ? (
                <div className="text-center py-20 text-gray-600">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No activity logged yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {logs.map(log => {
                        const Icon = ACTION_ICON[log.action] || Shield;
                        const cls = ACTION_COLOR[log.action] || 'text-gray-400 bg-white/5 border-white/10';
                        return (
                            <div key={log._id} className="glass-panel p-3 md:p-4 rounded-xl border border-[var(--color-glass-border)] flex items-start gap-3">
                                <div className={`p-2 rounded-lg border shrink-0 ${cls}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${cls}`}>{log.action}</span>
                                        <span className="text-xs text-gray-400">by <span className="text-white font-medium">{log.actorId?.username || 'System'}</span></span>
                                        <span className="text-[10px] text-gray-600 ml-auto">{log.createdAt ? format(new Date(log.createdAt), 'MMM d, yyyy HH:mm') : ''}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 line-clamp-2">{log.detail}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminLogs;
