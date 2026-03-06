import { useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { Users, MessageSquare, Image, Activity, UserX, TrendingUp } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart
} from 'recharts';

const StatCard = ({ label, value, icon: Icon, color, glow }) => (
    <div className={`glass-panel p-4 md:p-5 rounded-2xl border border-[var(--color-glass-border)] relative overflow-hidden`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 pointer-events-none`} />
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-2xl md:text-3xl font-black ${glow}`}>{value ?? '—'}</p>
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-20`} style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Icon className="w-5 h-5 text-gray-300" />
            </div>
        </div>
    </div>
);

const customTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-panel text-xs p-2 rounded-xl border border-[var(--color-glass-border)] shadow-2xl">
            <p className="text-gray-400 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
            ))}
        </div>
    );
};

const AdminDashboard = () => {
    const { stats, messagesPerDay, usersPerWeek, fetchStats } = useAdminStore();

    useEffect(() => { fetchStats(); }, []);

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'from-cyan-500 to-blue-600', glow: 'neon-text-cyan' },
        { label: 'Online Now', value: stats?.activeUsers, icon: Activity, color: 'from-green-500 to-emerald-600', glow: 'text-green-400' },
        { label: 'Messages Today', value: stats?.messagesToday, icon: MessageSquare, color: 'from-purple-500 to-pink-600', glow: 'neon-text-purple' },
        { label: 'Total Messages', value: stats?.totalMessages, icon: TrendingUp, color: 'from-orange-500 to-red-600', glow: 'text-orange-400' },
        { label: 'Total Media', value: stats?.totalMedia, icon: Image, color: 'from-pink-500 to-rose-600', glow: 'text-pink-400' },
        { label: 'Banned Users', value: stats?.bannedUsers, icon: UserX, color: 'from-red-500 to-rose-700', glow: 'text-red-400' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-black text-white">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">Real-time system overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {statCards.map(c => <StatCard key={c.label} {...c} />)}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Messages per day */}
                <div className="glass-panel p-4 md:p-5 rounded-2xl border border-[var(--color-glass-border)]">
                    <h2 className="text-sm font-semibold text-gray-300 mb-4">Messages per Day (7d)</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={messagesPerDay}>
                            <defs>
                                <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-neon-cyan)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-neon-cyan)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip content={customTooltip} />
                            <Area type="monotone" dataKey="messages" name="Messages" stroke="var(--color-neon-cyan)" strokeWidth={2} fill="url(#msgGrad)" dot={{ fill: 'var(--color-neon-cyan)', r: 3 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* New users per week */}
                <div className="glass-panel p-4 md:p-5 rounded-2xl border border-[var(--color-glass-border)]">
                    <h2 className="text-sm font-semibold text-gray-300 mb-4">New Users per Week (4w)</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={usersPerWeek}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={customTooltip} />
                            <Bar dataKey="users" name="New Users" fill="var(--color-neon-purple)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
