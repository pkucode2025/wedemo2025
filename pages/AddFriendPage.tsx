import React, { useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { friendsApi } from '../services/friendsApi';
import { useAuth } from '../contexts/AuthContext';

interface SearchResult {
    userId: string;
    username: string;
    displayName: string;
    avatar: string;
}

interface AddFriendPageProps {
    onClose: () => void;
    onFriendAdded: () => void;
}

const AddFriendPage: React.FC<AddFriendPageProps> = ({ onClose, onFriendAdded }) => {
    const { token } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSearch = async () => {
        if (!searchQuery.trim() || !token) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const data = await friendsApi.searchUsers(searchQuery, token);
            setSearchResults(data.users || []);

            if (data.users.length === 0) {
                setError('未找到匹配的用户');
            }
        } catch (err: any) {
            setError(err.message || '搜索失败');
        } finally {
            setLoading(false);
        }
    };

    const handleAddFriend = async (userId: string, displayName: string) => {
        if (!token) return;

        try {
            await friendsApi.addFriend(userId, token);
            setSuccess(`已添加 ${displayName} 为好友！`);
            onFriendAdded();

            // 从搜索结果中移除已添加的用户
            setSearchResults(prev => prev.filter(u => u.userId !== userId));
        } catch (err: any) {
            setError(err.message || '添加失败');
        }
    };

    return (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
            {/* Header */}
            <div className="h-[50px] bg-[#EDEDED] border-b border-gray-300 flex items-center px-3">
                <button onClick={onClose} className="p-2">
                    <X className="w-6 h-6" />
                </button>
                <span className="flex-1 text-center text-[17px] font-medium">添加好友</span>
                <div className="w-10"></div>
            </div>

            {/* Search Bar */}
            <div className="p-4 bg-[#EDEDED]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="用户名或昵称"
                        className="flex-1 px-4 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#07C160]"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-4 py-2 bg-[#07C160] text-white rounded-md hover:bg-[#06AD56] disabled:bg-gray-300"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="mx-4 mt-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
                    {success}
                </div>
            )}

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-gray-500">搜索中...</div>
                    </div>
                ) : searchResults.length > 0 ? (
                    <div>
                        {searchResults.map((user) => (
                            <div
                                key={user.userId}
                                className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200"
                            >
                                <div className="flex items-center">
                                    <img
                                        src={user.avatar}
                                        alt={user.displayName}
                                        className="w-12 h-12 rounded-md mr-3"
                                    />
                                    <div>
                                        <div className="font-medium text-[17px]">{user.displayName}</div>
                                        <div className="text-sm text-gray-500">@{user.username}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAddFriend(user.userId, user.displayName)}
                                    className="flex items-center gap-1 px-4 py-2 bg-[#07C160] text-white rounded-md text-sm hover:bg-[#06AD56]"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    添加
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Search className="w-16 h-16 mb-4" />
                        <p>搜索用户名或昵称</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddFriendPage;
