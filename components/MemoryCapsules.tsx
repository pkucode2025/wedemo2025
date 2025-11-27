import React, { useState, useEffect } from 'react';
import { X, Clock, Lock, Unlock, Plus, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { capsuleApi, Capsule } from '../services/capsuleApi';
import { friendsApi } from '../services/friendsApi';

interface MemoryCapsulesProps {
    onClose: () => void;
}

const MemoryCapsules: React.FC<MemoryCapsulesProps> = ({ onClose }) => {
    const { user, token } = useAuth();
    const [capsules, setCapsules] = useState<Capsule[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'create'>('list');

    // Create form state
    const [content, setContent] = useState('');
    const [unlockDate, setUnlockDate] = useState('');
    const [selectedFriendId, setSelectedFriendId] = useState('');
    const [friends, setFriends] = useState<any[]>([]);

    useEffect(() => {
        loadCapsules();
        loadFriends();
    }, [token]);

    const loadCapsules = async () => {
        if (!token) return;
        try {
            const data = await capsuleApi.getCapsules(token);
            setCapsules(data);
        } catch (error) {
            console.error('Failed to load capsules:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFriends = async () => {
        if (!token) return;
        try {
            const data = await friendsApi.getFriends(token);
            setFriends(data);
        } catch (error) {
            console.error('Failed to load friends:', error);
        }
    };

    const handleCreate = async () => {
        if (!token || !selectedFriendId || !content || !unlockDate) return;
        try {
            await capsuleApi.createCapsule(token, {
                receiverId: selectedFriendId,
                content,
                unlockAt: new Date(unlockDate).toISOString()
            });
            setView('list');
            loadCapsules();
            alert('Time capsule buried successfully! 🕰️');
        } catch (error) {
            console.error('Failed to create capsule:', error);
            alert('Failed to create capsule');
        }
    };

    const handleOpen = async (capsule: Capsule) => {
        if (!token) return;
        const now = new Date();
        const unlockTime = new Date(capsule.unlock_at);

        if (now < unlockTime) {
            alert(`This capsule is locked until ${unlockTime.toLocaleDateString()} ${unlockTime.toLocaleTimeString()}`);
            return;
        }

        try {
            const res = await capsuleApi.openCapsule(token, capsule.id);
            setCapsules(prev => prev.map(c => c.id === capsule.id ? { ...c, is_opened: true } : c));
            alert('Capsule opened! 🎉\n\n' + capsule.content);
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="bg-[#1E1E1E] w-full max-w-lg h-[600px] rounded-2xl flex flex-col border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-orange-900/20 to-red-900/20">
                    <div className="flex items-center gap-2">
                        <Clock className="w-6 h-6 text-orange-400" />
                        <h2 className="text-xl font-bold text-white">Memory Capsules</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {view === 'list' ? (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-gray-400 text-sm">Your Time Capsules</h3>
                                <button
                                    onClick={() => setView('create')}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-full text-sm hover:bg-orange-500/30 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Bury New Capsule
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center text-gray-500 mt-10">Loading...</div>
                            ) : capsules.length === 0 ? (
                                <div className="text-center text-gray-500 mt-10">
                                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No capsules found.</p>
                                    <p className="text-xs mt-1">Bury a memory for the future!</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {capsules.map((capsule) => {
                                        const isLocked = new Date() < new Date(capsule.unlock_at);
                                        return (
                                            <div
                                                key={capsule.id}
                                                onClick={() => handleOpen(capsule)}
                                                className={`p-4 rounded-xl border transition-all cursor-pointer relative group overflow-hidden
                                                    ${capsule.is_opened
                                                        ? 'bg-[#2A2A2A] border-white/5'
                                                        : 'bg-gradient-to-br from-orange-900/10 to-red-900/10 border-orange-500/20 hover:border-orange-500/50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={capsule.sender_avatar || 'https://picsum.photos/50'}
                                                            className="w-8 h-8 rounded-full border border-white/10"
                                                            alt=""
                                                        />
                                                        <div>
                                                            <p className="text-sm font-bold text-white">{capsule.sender_name}</p>
                                                            <p className="text-[10px] text-gray-500">From {new Date(capsule.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    {capsule.is_opened ? (
                                                        <Unlock className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <Lock className={`w-5 h-5 ${isLocked ? 'text-red-500' : 'text-green-400 animate-pulse'}`} />
                                                    )}
                                                </div>

                                                <div className="mt-3">
                                                    {capsule.is_opened ? (
                                                        <p className="text-gray-300 text-sm">{capsule.content}</p>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-orange-400/70 text-sm">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>Unlocks on {new Date(capsule.unlock_at).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-xs mb-1">To</label>
                                <select
                                    value={selectedFriendId}
                                    onChange={(e) => setSelectedFriendId(e.target.value)}
                                    className="w-full bg-[#2A2A2A] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-orange-500"
                                >
                                    <option value="">Select a friend</option>
                                    {friends.map(f => (
                                        <option key={f.userId} value={f.userId}>{f.displayName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Unlock Date</label>
                                <input
                                    type="datetime-local"
                                    value={unlockDate}
                                    onChange={(e) => setUnlockDate(e.target.value)}
                                    className="w-full bg-[#2A2A2A] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Message</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Write a message for the future..."
                                    className="w-full h-32 bg-[#2A2A2A] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-orange-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setView('list')}
                                    className="flex-1 py-3 bg-[#2A2A2A] text-white rounded-xl hover:bg-[#333333]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20"
                                >
                                    Bury Capsule
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemoryCapsules;
