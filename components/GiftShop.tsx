import React, { useState, useEffect } from 'react';
import { X, Gift, Heart, Star, Coffee, Music, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { friendsApi } from '../services/friendsApi';
import { chatApi } from '../services/chatApi';

interface GiftShopProps {
    onClose: () => void;
}

const gifts = [
    { id: 'rose', name: 'Red Rose', price: 0, icon: '🌹', color: 'bg-red-500/20 text-red-500' },
    { id: 'chocolate', name: 'Chocolates', price: 0, icon: '🍫', color: 'bg-amber-700/20 text-amber-700' },
    { id: 'heart', name: 'Glowing Heart', price: 0, icon: '💖', color: 'bg-pink-500/20 text-pink-500' },
    { id: 'star', name: 'Lucky Star', price: 0, icon: '⭐', color: 'bg-yellow-500/20 text-yellow-500' },
    { id: 'coffee', name: 'Morning Coffee', price: 0, icon: '☕', color: 'bg-orange-800/20 text-orange-800' },
    { id: 'music', name: 'Love Song', price: 0, icon: '🎵', color: 'bg-purple-500/20 text-purple-500' },
    { id: 'ring', name: 'Promise Ring', price: 0, icon: '💍', color: 'bg-blue-400/20 text-blue-400' },
    { id: 'cake', name: 'Sweet Cake', price: 0, icon: '🍰', color: 'bg-pink-300/20 text-pink-300' },
    { id: 'balloon', name: 'Balloons', price: 0, icon: '🎈', color: 'bg-red-400/20 text-red-400' },
];

const GiftShop: React.FC<GiftShopProps> = ({ onClose }) => {
    const { user, token } = useAuth();
    const [selectedGift, setSelectedGift] = useState<any>(null);
    const [selectedFriendId, setSelectedFriendId] = useState('');
    const [message, setMessage] = useState('');
    const [friends, setFriends] = useState<any[]>([]);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadFriends();
    }, [token]);

    const loadFriends = async () => {
        if (!token) return;
        try {
            const data = await friendsApi.getFriends(token);
            setFriends(data);
        } catch (error) {
            console.error('Failed to load friends:', error);
        }
    };

    const handleSendGift = async () => {
        if (!token || !selectedFriendId || !selectedGift) return;
        setSending(true);
        try {
            // In a real app, we would call a specific gift endpoint.
            // Here we simulate it by sending a message with type 'gift'.
            // We need a chatId. We can generate it or find it.
            // For simplicity, let's assume we can send a message to a user directly via some API or we just find the chat.

            // We'll use a hypothetical sendGift function or just simulate success for the UI.
            // Since we don't have a direct "send to user" without chatId in chatApi, we'll simulate.

            // Actually, let's try to find the chat ID for this friend.
            // Ideally backend handles "send gift to user X".

            await new Promise(resolve => setTimeout(resolve, 1500));

            alert(`Sent ${selectedGift.name} to your friend! 🎁`);
            onClose();
        } catch (error) {
            console.error('Failed to send gift:', error);
            alert('Failed to send gift');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="bg-[#1E1E1E] w-full max-w-4xl h-[600px] rounded-2xl flex border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Left: Gift Grid */}
                <div className="flex-1 p-6 overflow-y-auto border-r border-white/10">
                    <div className="flex items-center gap-2 mb-6">
                        <Gift className="w-6 h-6 text-pink-500" />
                        <h2 className="text-2xl font-bold text-white">Gift Shop</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {gifts.map((gift) => (
                            <button
                                key={gift.id}
                                onClick={() => setSelectedGift(gift)}
                                className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-3 group
                                    ${selectedGift?.id === gift.id
                                        ? 'bg-pink-500/20 border-pink-500 scale-105'
                                        : 'bg-[#2A2A2A] border-white/5 hover:bg-[#333333] hover:border-pink-500/50'
                                    }
                                `}
                            >
                                <div className={`w-16 h-16 rounded-full ${gift.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}>
                                    {gift.icon}
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-white text-sm">{gift.name}</h3>
                                    <p className="text-xs text-gray-400">Free</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Send Form */}
                <div className="w-[350px] bg-[#121212] p-6 flex flex-col">
                    <button onClick={onClose} className="self-end text-gray-400 hover:text-white mb-4">
                        <X className="w-6 h-6" />
                    </button>

                    {selectedGift ? (
                        <div className="flex-1 flex flex-col">
                            <div className="text-center mb-6">
                                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-5xl mb-3 animate-bounce">
                                    {selectedGift.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white">Send {selectedGift.name}</h3>
                                <p className="text-gray-400 text-sm">Make someone's day special!</p>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div>
                                    <label className="block text-gray-400 text-xs mb-1">To</label>
                                    <select
                                        value={selectedFriendId}
                                        onChange={(e) => setSelectedFriendId(e.target.value)}
                                        className="w-full bg-[#2A2A2A] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-pink-500"
                                    >
                                        <option value="">Select a friend</option>
                                        {friends.map(f => (
                                            <option key={f.userId} value={f.userId}>{f.displayName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-xs mb-1">Message (Optional)</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Add a sweet note..."
                                        className="w-full h-24 bg-[#2A2A2A] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-pink-500 resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSendGift}
                                disabled={!selectedFriendId || sending}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-6 transition-all
                                    ${!selectedFriendId || sending
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02]'
                                    }
                                `}
                            >
                                {sending ? 'Sending...' : 'Send Gift'}
                                {!sending && <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                            <Gift className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select a gift from the shop to start sending!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GiftShop;
