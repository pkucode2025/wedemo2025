import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, MessageCircle, Image } from 'lucide-react';

interface AdminAnalyticsTabProps {
    token: string;
}

const AdminAnalyticsTab: React.FC<AdminAnalyticsTabProps> = ({ token }) => {
    const [userStats, setUserStats] = useState<any>(null);
    const [activityStats, setActivityStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [usersRes, activityRes] = await Promise.all([
                fetch('/api/admin/analytics/users', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/admin/analytics/activity', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (usersRes.ok) setUserStats(await usersRes.json());
            if (activityRes.ok) setActivityStats(await activityRes.json());
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-gray-400 p-4">Loading analytics...</div>;

    const totalMessages = activityStats?.messages?.reduce((sum: number, day: any) => sum + parseInt(day.count), 0) || 0;
    const totalMoments = activityStats?.moments?.reduce((sum: number, day: any) => sum + parseInt(day.count), 0) || 0;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Analytics Dashboard</h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-xl border border-blue-500/30">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-8 h-8 text-blue-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">{userStats?.total || 0}</div>
                            <div className="text-sm text-gray-400">Total Users</div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-6 rounded-xl border border-green-500/30">
                    <div className="flex items-center gap-3 mb-2">
                        <MessageCircle className="w-8 h-8 text-green-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">{totalMessages}</div>
                            <div className="text-sm text-gray-400">Total Messages</div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-6 rounded-xl border border-purple-500/30">
                    <div className="flex items-center gap-3 mb-2">
                        <Image className="w-8 h-8 text-purple-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">{totalMoments}</div>
                            <div className="text-sm text-gray-400">Total Moments</div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 p-6 rounded-xl border border-pink-500/30">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-8 h-8 text-pink-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {userStats?.daily?.[0]?.user_count || 0}
                            </div>
                            <div className="text-sm text-gray-400">New Users Today</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Growth */}
            <div className="bg-[#1E1E1E] rounded-xl border border-white/10 p-6 mb-6">
                <h3 className="text-lg font-bold text-white mb-4">User Registration (Last 30 Days)</h3>
                <div className="space-y-2">
                    {userStats?.daily?.slice(0, 10).map((day: any) => (
                        <div key={day.date} className="flex items-center gap-3">
                            <div className="text-sm text-gray-400 w-32">{new Date(day.date).toLocaleDateString()}</div>
                            <div className="flex-1 bg-[#252525] rounded-full h-6 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center px-3"
                                    style={{ width: `${Math.min(100, (day.user_count / Math.max(...userStats.daily.map((d: any) => d.user_count))) * 100)}%` }}
                                >
                                    <span className="text-xs text-white font-semibold">{day.user_count}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activity Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1E1E1E] rounded-xl border border-white/10 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Messages per Day</h3>
                    <div className="space-y-2">
                        {activityStats?.messages?.slice(0, 7).map((day: any) => (
                            <div key={day.date} className="flex items-center gap-3">
                                <div className="text-sm text-gray-400 w-32">{new Date(day.date).toLocaleDateString()}</div>
                                <div className="flex-1 bg-[#252525] rounded-full h-6 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center px-3"
                                        style={{ width: `${day.count > 0 ? Math.min(100, (day.count / 100) * 100) : 0}%` }}
                                    >
                                        <span className="text-xs text-white font-semibold">{day.count}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#1E1E1E] rounded-xl border border-white/10 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Moments per Day</h3>
                    <div className="space-y-2">
                        {activityStats?.moments?.slice(0, 7).map((day: any) => (
                            <div key={day.date} className="flex items-center gap-3">
                                <div className="text-sm text-gray-400 w-32">{new Date(day.date).toLocaleDateString()}</div>
                                <div className="flex-1 bg-[#252525] rounded-full h-6 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center px-3"
                                        style={{ width: `${day.count > 0 ? Math.min(100, (day.count / 20) * 100) : 0}%` }}
                                    >
                                        <span className="text-xs text-white font-semibold">{day.count}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsTab;
