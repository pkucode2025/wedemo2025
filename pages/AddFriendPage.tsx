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
            await friendsApi.addFriend(friendId, token);
            setAddedIds(prev => new Set(prev).add(friendId));
        } catch (error) {
            console.error('Add friend failed:', error);
            alert('Failed to add friend');
        }
    };

    return (
        <div className="w-full h-full bg-[#121212] flex flex-col">
            {/* Header */}
            <div className="h-[60px] flex items-center px-4 border-b border-white/10 bg-[#1E1E1E]">
                <button onClick={onBack} className="mr-4 text-white">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-white text-lg font-medium">Add Friend</h1>
            </div>

            {/* Search Bar */}
            <div className="p-4">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search by username or display name"
                        className="w-full bg-[#2A2A2A] text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF00FF]"
                    />
                    <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-4">
                {loading ? (
                    <div className="text-center text-gray-500 mt-8">Searching...</div>
                ) : results.length > 0 ? (
                    <div className="space-y-4">
                        {results.map(result => (
                            <div key={result.userId} className="bg-[#1E1E1E] p-4 rounded-xl flex items-center justify-between border border-white/5">
                                <div className="flex items-center gap-3">
                                    <img src={result.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <h3 className="text-white font-medium">{result.displayName}</h3>
                                        <p className="text-gray-500 text-sm">@{result.username}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAddFriend(result.userId)}
                                    disabled={addedIds.has(result.userId)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${addedIds.has(result.userId)
                                            ? 'bg-green-500/20 text-green-500'
                                            : 'bg-[#FF00FF] text-white hover:bg-[#D900D9]'
                                        }`}
                                >
                                    {addedIds.has(result.userId) ? (
                                        <span className="flex items-center gap-1"><Check className="w-4 h-4" /> Added</span>
                                    ) : (
                                        <span className="flex items-center gap-1"><UserPlus className="w-4 h-4" /> Add</span>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : query && !loading ? (
                    <div className="text-center text-gray-500 mt-8">No users found</div>
                ) : null}
            </div>
        </div>
    );
};

export default AddFriendPage;
