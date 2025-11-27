import React, { useState } from 'react';
import { ArrowLeft, Search, UserPlus, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { friendsApi } from '../services/friendsApi';

interface AddFriendPageProps {
    onBack: () => void;
}

interface SearchResult {
    userId: string;
    username: string;
    displayName: string;
    avatar: string;
}

const AddFriendPage: React.FC<AddFriendPageProps> = ({ onBack }) => {
    const { token, user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

    const handleSearch = async () => {
        if (!query.trim() || !token) return;
        setLoading(true);
        try {
            const users = await friendsApi.searchUsers(query, token);
            // Filter out self
            setResults(users.filter((u: SearchResult) => u.userId !== user?.userId));
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFriend = async (friendId: string) => {
        if (!token) return;
        try {
            await friendsApi.sendFriendRequest(friendId, token);
            setAddedIds(prev => new Set(prev).add(friendId));
            alert('好友申请已发送');
        } catch (error) {
            console.error('Add friend failed:', error);
            alert('Failed to send request');
        }
    };

    return (
        <div className="w-full h-full bg-[#121212] flex flex-col overflow-hidden">
            {/* Header with Neon Style */}
            <div className="h-[60px] flex items-center px-4 border-b border-[#FF00FF]/20 bg-gradient-to-r from-[#1E1E1E] to-[#2A1E2A] backdrop-blur-sm">
                <button onClick={onBack} className="mr-4 text-[#FF00FF] hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-white text-lg font-bold bg-gradient-to-r from-[#FF00FF] to-[#8A2BE2] bg-clip-text text-transparent">
                    添加好友
                </h1>
            </div>

            {/* Search Bar with Neon Style */}
            <div className="p-4 bg-[#1E1E1E] border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="搜索用户名或昵称..."
                            className="w-full bg-[#2A2A2A] text-white pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF00FF] focus:border-transparent placeholder-gray-500"
                        />
                        <Search className="absolute left-3 top-3.5 w-5 h-5 text-[#FF00FF]" />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#8A2BE2] text-white text-sm font-medium hover:from-[#D900D9] hover:to-[#7A1FA2] transition-all shadow-lg shadow-[#FF00FF]/30 disabled:opacity-50"
                    >
                        {loading ? '搜索中...' : '搜索'}
                    </button>
                </div>
            </div>

            {/* Results with Neon Style */}
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
                {loading ? (
                    <div className="text-center text-[#FF00FF] mt-8 animate-pulse">搜索中...</div>
                ) : results.length > 0 ? (
                    <div className="space-y-3">
                        {results.map(result => (
                            <div key={result.userId} className="bg-gradient-to-r from-[#1E1E1E] to-[#2A1E2A] p-4 rounded-xl flex items-center justify-between border border-[#FF00FF]/20 hover:border-[#FF00FF]/40 transition-all shadow-lg shadow-black/20">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img 
                                            src={result.avatar || 'https://picsum.photos/id/64/200/200'} 
                                            alt="" 
                                            className="w-14 h-14 rounded-full object-cover border-2 border-[#FF00FF]/30" 
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FF00FF] rounded-full border-2 border-[#1E1E1E]"></div>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-base">{result.displayName}</h3>
                                        <p className="text-gray-400 text-sm">@{result.username}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAddFriend(result.userId)}
                                    disabled={addedIds.has(result.userId)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        addedIds.has(result.userId)
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-gradient-to-r from-[#FF00FF] to-[#8A2BE2] text-white hover:from-[#D900D9] hover:to-[#7A1FA2] shadow-lg shadow-[#FF00FF]/30'
                                    }`}
                                >
                                    {addedIds.has(result.userId) ? (
                                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> 已添加</span>
                                    ) : (
                                        <span className="flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> 添加</span>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : query && !loading ? (
                    <div className="text-center text-gray-400 mt-12">
                        <div className="text-4xl mb-4">🔍</div>
                        <p>未找到用户</p>
                        <p className="text-sm text-gray-500 mt-2">请尝试其他关键词</p>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 mt-12">
                        <div className="text-4xl mb-4">👥</div>
                        <p>搜索用户添加好友</p>
                        <p className="text-sm text-gray-500 mt-2">输入用户名或昵称开始搜索</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddFriendPage;
