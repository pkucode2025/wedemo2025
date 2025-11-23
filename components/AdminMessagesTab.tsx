import React, { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';

interface AdminMessagesTabProps {
    token: string;
}

const AdminMessagesTab: React.FC<AdminMessagesTabProps> = ({ token }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const searchMessages = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/messages/search?q=${encodeURIComponent(searchQuery)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Failed to search messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteMessage = async (messageId: number) => {
        if (!confirm('Delete this message?')) return;

        try {
            await fetch(`/api/admin/messages/${messageId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(messages.filter(m => m.id !== messageId));
        } catch (error) {
            alert('Failed to delete message');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Message Search & Moderation</h2>

            {/* Search Bar */}
            <div className="mb-6 flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchMessages()}
                        placeholder="Search messages by content..."
                        className="w-full bg-[#1E1E1E] text-white pl-12 pr-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF00FF]"
                    />
                </div>
                <button
                    onClick={searchMessages}
                    disabled={loading}
                    className="bg-[#FF00FF] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#D900D9] disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {/* Messages List */}
            <div className="bg-[#1E1E1E] rounded-xl border border-white/10 overflow-hidden">
                {messages.length > 0 ? (
                    <div className="divide-y divide-white/5">
                        {messages.map((msg) => (
                            <div key={msg.id} className="p-4 hover:bg-[#252525] transition-colors">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <img src={msg.avatar_url} className="w-8 h-8 rounded-full bg-gray-700" />
                                            <span className="font-semibold text-white">{msg.display_name || msg.sender_id}</span>
                                            <span className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-gray-300 mb-2">{msg.content}</p>
                                        <div className="text-xs text-gray-500">
                                            Chat ID: <span className="font-mono">{msg.chat_id}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteMessage(msg.id)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors flex-shrink-0"
                                        title="Delete Message"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        {searchQuery ? 'No messages found' : 'Enter a search query to find messages'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMessagesTab;
