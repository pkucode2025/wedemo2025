import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { friendsApi } from '../services/friendsApi';
import { groupsApi } from '../services/groupsApi';

interface CreateGroupPageProps {
    onBack: () => void;
    onGroupCreated: () => void;
}

interface Friend {
    userId: string;
    displayName: string;
    avatar: string;
}

const CreateGroupPage: React.FC<CreateGroupPageProps> = ({ onBack, onGroupCreated }) => {
    const { token } = useAuth();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (token) {
            friendsApi.getFriends(token)
                .then(data => {
                    setFriends(data.friends || []);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Failed to load friends:', err);
                    setLoading(false);
                });
        }
    }, [token]);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedIds.size === 0 || !token) return;
        setCreating(true);
        try {
            await groupsApi.createGroup(groupName, Array.from(selectedIds), token);
            onGroupCreated();
        } catch (error) {
            console.error('Failed to create group:', error);
            alert('Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="w-full h-full bg-[#121212] flex flex-col">
            {/* Header */}
            <div className="h-[60px] flex items-center justify-between px-4 border-b border-white/10 bg-[#1E1E1E]">
                <button onClick={onBack} className="text-white">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-white text-lg font-medium">Create Group</h1>
                <button
                    onClick={handleCreate}
                    disabled={creating || !groupName.trim() || selectedIds.size === 0}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${creating || !groupName.trim() || selectedIds.size === 0
                            ? 'bg-gray-700 text-gray-400'
                            : 'bg-[#FF00FF] text-white'
                        }`}
                >
                    {creating ? 'Creating...' : 'Create'}
                </button>
            </div>

            {/* Group Info */}
            <div className="p-4 border-b border-white/5">
                <label className="block text-gray-400 text-sm mb-2">Group Name</label>
                <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF00FF]"
                />
            </div>

            {/* Friends List */}
            <div className="flex-1 overflow-y-auto p-4">
                <h2 className="text-gray-400 text-sm mb-4">Select Members ({selectedIds.size})</h2>
                {loading ? (
                    <div className="text-center text-gray-500">Loading friends...</div>
                ) : (
                    <div className="space-y-2">
                        {friends.map(friend => (
                            <div
                                key={friend.userId}
                                onClick={() => toggleSelection(friend.userId)}
                                className={`flex items-center p-3 rounded-xl cursor-pointer border transition-all ${selectedIds.has(friend.userId)
                                        ? 'bg-[#FF00FF]/10 border-[#FF00FF]'
                                        : 'bg-[#1E1E1E] border-transparent hover:bg-[#2A2A2A]'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${selectedIds.has(friend.userId)
                                        ? 'bg-[#FF00FF] border-[#FF00FF]'
                                        : 'border-gray-500'
                                    }`}>
                                    {selectedIds.has(friend.userId) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <img src={friend.avatar} alt="" className="w-10 h-10 rounded-full object-cover mr-3" />
                                <span className="text-white">{friend.displayName}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateGroupPage;
