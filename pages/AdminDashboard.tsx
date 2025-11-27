import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Image, Activity, Trash2, Edit, Save, X, LogOut, MessageCircle, UsersRound, Search, TrendingUp, Eye, Settings } from 'lucide-react';
import AdminChatsTab from '../components/AdminChatsTab';
import AdminGroupsTab from '../components/AdminGroupsTab';
import AdminMessagesTab from '../components/AdminMessagesTab';
import AdminAnalyticsTab from '../components/AdminAnalyticsTab';
import AdminSystemTab from '../components/AdminSystemTab';
import AdminBulkActionsTab from '../components/AdminBulkActionsTab';

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
    is_banned?: boolean;
}

interface AdminMoment {
    id: number;
    user_id: string;
    content: string;
    display_name: string;
    created_at: string;
    images: string[];
    avatar_url?: string;
    is_pinned?: boolean;
    is_banned?: boolean;
    likes?: any[];
    comments?: any[];
}

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'moments' | 'chats' | 'groups' | 'messages' | 'analytics' | 'system' | 'bulk'>('overview');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [moments, setMoments] = useState<AdminMoment[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState({ display_name: '', password: '', is_admin: false, is_banned: false });
    const [newUserForm, setNewUserForm] = useState({ username: '', password: '', display_name: '', is_admin: false });
    const [forceFriendForm, setForceFriendForm] = useState({ username1: '', username2: '' });
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
            is_admin: user.is_admin,
            is_banned: user.is_banned || false
        });
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            const body: any = {
                display_name: editForm.display_name,
                is_admin: editForm.is_admin,
                is_banned: editForm.is_banned
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

    const handleCreateUser = async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        if (!newUserForm.username || !newUserForm.password || !newUserForm.display_name) {
            alert('Please fill in all new user information');
            return;
        }

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: newUserForm.username,
                    password: newUserForm.password,
                    display_name: newUserForm.display_name,
                    is_admin: newUserForm.is_admin
                })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Failed to create user');
                return;
            }

            setNewUserForm({ username: '', password: '', display_name: '', is_admin: false });
            fetchData(token);
        } catch (error) {
            alert('Error creating user');
        }
    };

    const handleDeleteAllMoments = async () => {
        if (!confirm('Are you sure you want to delete ALL moments? This action cannot be undone!')) return;
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            await fetch('/api/admin/moments', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(token);
        } catch (error) {
            alert('Failed to delete all moments');
        }
    };

    const handleTogglePinMoment = async (moment: AdminMoment) => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        const action = moment.is_pinned ? 'unpin' : 'pin';
        try {
            await fetch(`/api/admin/moments/${moment.id}/${action}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(token);
        } catch {
            alert('Failed to update pin status');
        }
    };

    const handleToggleBanMoment = async (moment: AdminMoment) => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        const action = moment.is_banned ? 'unban' : 'ban';
        try {
            await fetch(`/api/admin/moments/${moment.id}/${action}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(token);
        } catch {
            alert('Failed to update ban status');
        }
    };

    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#121212] text-white">
            {/* Mobile Header (Fixed) */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 z-40 bg-[#1E1E1E] border-b border-white/10 px-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 text-[#FF00FF] hover:bg-white/5 rounded-lg"
                    >
                        <Users className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                </div>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar (Fixed) */}
            <div className={`
                fixed top-0 left-0 h-full w-64 z-50 bg-[#1E1E1E] border-r border-white/10 
                transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
            `}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center h-16 md:h-auto">
                    <h1 className="text-2xl font-bold text-[#FF00FF]">Admin Panel</h1>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden text-gray-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button
                        onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'overview' ? 'bg-[#FF00FF] text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Activity className="w-5 h-5" />
                        <span className="font-medium">Overview</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-[#FF00FF] text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Users</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('moments'); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'moments' ? 'bg-[#FF00FF] text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Image className="w-5 h-5" />
                        <span className="font-medium">Moments</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('chats'); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'chats' ? 'bg-[#FF00FF] text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-medium">Chats</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('groups'); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'groups' ? 'bg-[#FF00FF] text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <UsersRound className="w-5 h-5" />
                        <span className="font-medium">Groups</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('messages'); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'messages' ? 'bg-[#FF00FF] text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Search className="w-5 h-5" />
                        <span className="font-medium">Messages</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'analytics' ? 'bg-[#FF00FF] text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-medium">Analytics</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('bulk'); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'bulk' ? 'bg-[#FF00FF] text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Bulk Actions</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('system'); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'system' ? 'bg-[#FF00FF] text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">System</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content (Margin Left on Desktop) */}
            <div className="md:ml-64 pt-16 md:pt-0 min-h-screen">
                <div className="min-h-full pb-20 md:pb-0">
                    {(activeTab === 'overview' || activeTab === 'users' || activeTab === 'moments') && loading ? (
                        <div className="text-center text-gray-500 mt-20">Loading...</div>
                    ) : (
                        <>
                            {activeTab === 'overview' && stats && (
                                <div className="p-4 md:p-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                        <StatCard title="Total Users" value={stats.users} icon={Users} color="bg-blue-500" />
                                        <StatCard title="Total Moments" value={stats.moments} icon={Image} color="bg-purple-500" />
                                        <StatCard title="Total Comments" value={stats.comments} icon={Activity} color="bg-green-500" />
                                        <StatCard title="Total Likes" value={stats.likes} icon={Activity} color="bg-pink-500" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div className="p-4 md:p-8 space-y-6">
                                    {/* Create New User */}
                                    <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 p-4 md:p-6 flex flex-col gap-4">
                                        <h2 className="font-semibold text-white text-lg">Create New User</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Username</label>
                                                <input
                                                    type="text"
                                                    value={newUserForm.username}
                                                    onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })}
                                                    className="w-full bg-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FF00FF]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Display Name</label>
                                                <input
                                                    type="text"
                                                    value={newUserForm.display_name}
                                                    onChange={e => setNewUserForm({ ...newUserForm, display_name: e.target.value })}
                                                    className="w-full bg-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FF00FF]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Password</label>
                                                <input
                                                    type="password"
                                                    value={newUserForm.password}
                                                    onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                                    className="w-full bg-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FF00FF]"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={newUserForm.is_admin}
                                                    onChange={e => setNewUserForm({ ...newUserForm, is_admin: e.target.checked })}
                                                    className="w-4 h-4 rounded bg-[#2A2A2A] border-gray-600 text-[#FF00FF] focus:ring-[#FF00FF]"
                                                />
                                                <span className="text-sm text-gray-300">Is Admin</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleCreateUser}
                                                className="px-4 py-2 bg-[#FF00FF] text-white rounded-xl text-sm font-medium hover:bg-[#D900D9] transition-colors"
                                            >
                                                Create User
                                            </button>
                                        </div>
                                    </div>

                                    {/* Force Friendship */}
                                    <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 p-4 md:p-6 flex flex-col gap-4">
                                        <h2 className="font-semibold text-white text-lg">Force Friendship</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Username A</label>
                                                <input
                                                    type="text"
                                                    value={forceFriendForm.username1}
                                                    onChange={e => setForceFriendForm({ ...forceFriendForm, username1: e.target.value })}
                                                    className="w-full bg-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FF00FF]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Username B</label>
                                                <input
                                                    type="text"
                                                    value={forceFriendForm.username2}
                                                    onChange={e => setForceFriendForm({ ...forceFriendForm, username2: e.target.value })}
                                                    className="w-full bg-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FF00FF]"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 justify-end">
                                            <button
                                                onClick={async () => {
                                                    const token = localStorage.getItem('adminToken');
                                                    if (!token) return;
                                                    try {
                                                        await fetch('/api/admin/friends/connect', {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                Authorization: `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify(forceFriendForm)
                                                        });
                                                        alert('Connected successfully');
                                                    } catch {
                                                        alert('Connection failed');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                                            >
                                                Connect
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const token = localStorage.getItem('adminToken');
                                                    if (!token) return;
                                                    try {
                                                        await fetch('/api/admin/friends/disconnect', {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                Authorization: `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify(forceFriendForm)
                                                        });
                                                        alert('Disconnected successfully');
                                                    } catch {
                                                        alert('Disconnection failed');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
                                            >
                                                Disconnect
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 overflow-x-auto">
                                        <table className="w-full text-left min-w-[600px]">
                                            <thead className="bg-black/20 text-gray-400 text-xs uppercase">
                                                <tr>
                                                    <th className="px-6 py-4">User</th>
                                                    <th className="px-6 py-4">Role</th>
                                                    <th className="px-6 py-4">Joined</th>
                                                    <th className="px-6 py-4">Status</th>
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
                                                        <td className="px-6 py-4">
                                                            {user.is_banned ? (
                                                                <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">Banned</span>
                                                            ) : (
                                                                <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">Active</span>
                                                            )}
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
                                <div className="p-4 md:p-8 space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold text-white">All Moments</h2>
                                        <button
                                            onClick={handleDeleteAllMoments}
                                            className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
                                        >
                                            Delete All Moments
                                        </button>
                                    </div>
                                    {moments.map(moment => (
                                        <div key={moment.id} className="bg-[#1E1E1E] p-4 rounded-xl border border-white/10">
                                            <div className="flex gap-4">
                                                {moment.images && moment.images.length > 0 && (
                                                    <img src={moment.images[0]} className="w-24 h-24 object-cover rounded-lg bg-black/50" />
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-medium text-white">{moment.display_name}</h3>
                                                                {moment.is_pinned && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                                                                        PINNED
                                                                    </span>
                                                                )}
                                                                {moment.is_banned && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-300 border border-red-500/40">
                                                                        BANNED
                                                                    </span>
                                                                )}
                                                            </div>
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
                                                                onClick={() => handleTogglePinMoment(moment)}
                                                                className="p-2 hover:bg-yellow-500/10 text-yellow-500 rounded-lg"
                                                            >
                                                                {moment.is_pinned ? 'Unpin' : 'Pin'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleToggleBanMoment(moment)}
                                                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"
                                                            >
                                                                {moment.is_banned ? 'Unban' : 'Ban'}
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
                            {activeTab === 'bulk' && <AdminBulkActionsTab token={token} />}
                            {activeTab === 'system' && <AdminSystemTab token={token} />}
                        </>
                    )}
                </div>
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
                                    {viewingMoment.comments.map((comment: any, idx: number) => {
                                        const author = comment.user_name || comment.user?.displayName || 'Unknown';
                                        const text = comment.text || comment.content || '';
                                        return (
                                            <div key={idx} className="bg-[#252525] p-3 rounded-lg">
                                                <div className="text-[#FF00FF] font-semibold text-sm">{author}</div>
                                                <div className="text-gray-300 text-sm">{text}</div>
                                            </div>
                                        );
                                    })}
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
