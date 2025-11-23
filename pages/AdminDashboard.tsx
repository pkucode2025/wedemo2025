import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Image, Activity, Trash2, Edit, Save, X, LogOut, MessageCircle, UsersRound, Search, TrendingUp, Eye } from 'lucide-react';
import AdminChatsTab from '../components/AdminChatsTab';
import AdminGroupsTab from '../components/AdminGroupsTab';
import AdminMessagesTab from '../components/AdminMessagesTab';
import AdminAnalyticsTab from '../components/AdminAnalyticsTab';

interface AdminStats {
    users: number;
    moments: number;
    comments: number;
    likes: number;
}

interface AdminUser {
    id: number;
    user_id: string;
    username: string;
    display_name: string;
    is_admin: boolean;
    created_at: string;
}

interface AdminMoment {
    id: number;
    user_id: string;
    content: string;
    display_name: string;
    created_at: string;
    images: string[];
}

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'moments' | 'chats' | 'groups' | 'messages' | 'analytics'>('overview');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [moments, setMoments] = useState<AdminMoment[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState({ display_name: '', password: '', is_admin: false });
    const [viewingMoment, setViewingMoment] = useState<AdminMoment | null>(null);

    const token = localStorage.getItem('adminToken') || '';

    useEffect(() => {
        if (!token) {
            window.location.href = '/admin/login';
            return;
        }
        if (activeTab === 'overview' || activeTab === 'users' || activeTab === 'moments') {
            fetchData(token);
        }
    }, [activeTab, token]);

    const fetchData = async (token: string) => {
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            if (activeTab === 'overview') {
                const res = await fetch('/api/admin/stats', { headers });
                if (res.ok) setStats(await res.json());
                else if (res.status === 401 || res.status === 403) handleLogout();
            } else if (activeTab === 'users') {
                const res = await fetch('/api/admin/users', { headers });
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users);
                }
            } else if (activeTab === 'moments') {
                const res = await fetch('/api/admin/moments', { headers });
                if (res.ok) {
                    const data = await res.json();
                    setMoments(data.moments);
                }
            }
        } catch (error) {
            console.error('Admin fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure? This will delete ALL user data!')) return;
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(token);
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    const handleDeleteMoment = async (momentId: number) => {
        if (!confirm('Delete this moment?')) return;
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            await fetch(`/api/admin/moments/${momentId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(token);
        } catch (error) {
            alert('Failed to delete moment');
        }
    };

    const handleEditUser = (user: AdminUser) => {
        setEditingUser(user);
        setEditForm({
            display_name: user.display_name,
            password: '',
            is_admin: user.is_admin
        });
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            const body: any = {
                display_name: editForm.display_name,
                is_admin: editForm.is_admin
            };
            if (editForm.password) body.password = editForm.password;

            const res = await fetch(`/api/admin/users/${editingUser.user_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setEditingUser(null);
                fetchData(token);
            } else {
                alert('Failed to update user');
            }
        } catch (error) {
            alert('Error updating user');
        }
    };

    return (
        <div className="flex h-screen bg-[#121212] text-white">
            {/* Sidebar */}
            <div className="w-64 bg-[#1E1E1E] border-r border-white/10 p-4 flex flex-col">
                <h1 className="text-xl font-bold mb-8 text-[#FF00FF]">Admin Panel</h1>

                <nav className="space-y-2 flex-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'overview' ? 'bg-[#FF00FF] text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <Activity className="w-5 h-5" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-[#FF00FF] text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <Users className="w-5 h-5" />
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('moments')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'moments' ? 'bg-[#FF00FF] text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <Image className="w-5 h-5" />
                        Moments
                    </button>
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'chats' ? 'bg-[#FF00FF] text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <MessageCircle className="w-5 h-5" />
                        Chats
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'groups' ? 'bg-[#FF00FF] text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <UsersRound className="w-5 h-5" />
                        Groups
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'messages' ? 'bg-[#FF00FF] text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <Search className="w-5 h-5" />
                        Messages
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'analytics' ? 'bg-[#FF00FF] text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <TrendingUp className="w-5 h-5" />
                        Analytics
                    </button>
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {(activeTab === 'overview' || activeTab === 'users' || activeTab === 'moments') && loading ? (
                    <div className="text-center text-gray-500 mt-20">Loading...</div>
                ) : (
                    <>
                        {activeTab === 'overview' && stats && (
                            <div className="p-8">
                                <div className="grid grid-cols-4 gap-6">
                                    <StatCard title="Total Users" value={stats.users} icon={Users} color="bg-blue-500" />
                                    <StatCard title="Total Moments" value={stats.moments} icon={Image} color="bg-purple-500" />
                                    <StatCard title="Total Comments" value={stats.comments} icon={Activity} color="bg-green-500" />
                                    <StatCard title="Total Likes" value={stats.likes} icon={Activity} color="bg-pink-500" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="p-8">
                                <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-black/20 text-gray-400 text-xs uppercase">
                                            <tr>
                                                <th className="px-6 py-4">User</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Joined</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {users.map(user => (
                                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-white">{user.display_name}</div>
                                                            <div className="text-xs text-gray-500">@{user.username}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs ${user.is_admin ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                            {user.is_admin ? 'Admin' : 'User'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button
                                                            onClick={() => handleEditUser(user)}
                                                            className="p-2 hover:bg-white/10 rounded-lg text-blue-400"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.user_id)}
                                                            className="p-2 hover:bg-white/10 rounded-lg text-red-400"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'moments' && (
                            <div className="p-8 space-y-4">
                                {moments.map(moment => (
                                    <div key={moment.id} className="bg-[#1E1E1E] p-4 rounded-xl border border-white/10">
                                        <div className="flex gap-4">
                                            {moment.images && moment.images.length > 0 && (
                                                <img src={moment.images[0]} className="w-24 h-24 object-cover rounded-lg bg-black/50" />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-medium text-white">{moment.display_name}</h3>
                                                        <p className="text-xs text-gray-500 mb-2">{new Date(moment.created_at).toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setViewingMoment(moment)}
                                                            className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteMoment(moment.id)}
                                                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-gray-300 text-sm">{moment.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'chats' && <AdminChatsTab token={token} />}
                        {activeTab === 'groups' && <AdminGroupsTab token={token} />}
                        {activeTab === 'messages' && <AdminMessagesTab token={token} />}
                        {activeTab === 'analytics' && <AdminAnalyticsTab token={token} />}
                    </>
                )}
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1E1E1E] p-6 rounded-2xl w-full max-w-md border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Edit User</h2>
                            <button onClick={() => setEditingUser(null)}><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={editForm.display_name}
                                    onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
                                    className="w-full bg-[#2A2A2A] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#FF00FF]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">New Password (Optional)</label>
                                <input
                                    type="password"
                                    value={editForm.password}
                                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                    placeholder="Leave empty to keep current"
                                    className="w-full bg-[#2A2A2A] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#FF00FF]"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={editForm.is_admin}
                                    onChange={e => setEditForm({ ...editForm, is_admin: e.target.checked })}
                                    className="w-4 h-4 rounded bg-[#2A2A2A] border-gray-600 text-[#FF00FF] focus:ring-[#FF00FF]"
                                />
                                <label className="text-sm text-gray-300">Is Admin</label>
                            </div>

                            <button
                                onClick={handleSaveUser}
                                className="w-full bg-[#FF00FF] text-white py-3 rounded-xl font-medium hover:bg-[#D900D9] transition-colors mt-4"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Moment Modal */}
            {viewingMoment && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setViewingMoment(null)}>
                    <div className="bg-[#1E1E1E] p-6 rounded-2xl w-full max-w-2xl border border-white/10 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Moment Details</h2>
                            <button onClick={() => setViewingMoment(null)}><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                            {/* User Info */}
                            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                                <img src={viewingMoment.avatar_url} className="w-12 h-12 rounded-full bg-gray-700" />
                                <div>
                                    <div className="font-semibold text-white">{viewingMoment.display_name}</div>
                                    <div className="text-sm text-gray-500">{new Date(viewingMoment.created_at).toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="text-gray-300">{viewingMoment.content}</div>

                            {/* Images */}
                            {viewingMoment.images && viewingMoment.images.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {viewingMoment.images.map((img, idx) => (
                                        <img key={idx} src={img} className="w-full h-32 object-cover rounded-lg bg-black/50" />
                                    ))}
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex gap-6 py-4 border-y border-white/10 text-sm">
                                <div>
                                    <span className="text-gray-500">Likes: </span>
                                    <span className="text-white font-semibold">{viewingMoment.likes?.length || 0}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Comments: </span>
                                    <span className="text-white font-semibold">{viewingMoment.comments?.length || 0}</span>
                                </div>
                            </div>

                            {/* Comments */}
                            {viewingMoment.comments && viewingMoment.comments.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-white">Comments</h3>
                                    {viewingMoment.comments.map((comment: any, idx: number) => (
                                        <div key={idx} className="bg-[#252525] p-3 rounded-lg">
                                            <div className="text-[#FF00FF] font-semibold text-sm">{comment.user_name}</div>
                                            <div className="text-gray-300 text-sm">{comment.text}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number; icon: any; color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-white/10 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-20 text-white`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <div className="text-gray-400 text-xs uppercase tracking-wider">{title}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    </div>
);

export default AdminDashboard;
