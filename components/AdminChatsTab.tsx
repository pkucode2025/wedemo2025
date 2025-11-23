import React, { useState, useEffect } from 'react';
import { MessageCircle, Trash2, Eye, Search, X } from 'lucide-react';

interface AdminChatsTabProps {
    token: string;
}

interface Chat {
    chat_id: string;
    last_message_time: string;
    message_count: number;
    last_message: string;
    participant_names?: string[];
}

const AdminChatsTab: React.FC<AdminChatsTabProps> = ({ token }) => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/chats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setChats(data.chats || []);
            }
        } catch (error) {
            console.error('Failed to fetch chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewChatMessages = async (chatId: string) => {
        try {
            const res = await fetch(`/api/admin/chats/${chatId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                setSelectedChat(chatId);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const deleteChat = async (chatId: string) => {
        if (!confirm(`Delete chat ${chatId} and all its messages?`)) return;

        try {
            await fetch(`/api/admin/chats/${chatId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchChats();
        } catch (error) {
            alert('Failed to delete chat');
        }
    };

    if (loading) return <div className="text-gray-400 p-4">Loading chats...</div>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Chat Management</h2>

            <div className="bg-[#1E1E1E] rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#252525] border-b border-white/10">
                        <tr>
                            <th className="text-left p-4 text-gray-400 font-medium">Chat ID</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Messages</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Last Message</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Last Active</th>
                            <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chats.map((chat) => (
                            <tr key={chat.chat_id} className="border-b border-white/5 hover:bg-[#252525] transition-colors">
                                <td className="p-4 text-gray-300 font-mono text-sm">{chat.chat_id}</td>
                                <td className="p-4">
                                    <div className="text-gray-300">{chat.message_count} messages</div>
                                    {chat.participant_names && chat.participant_names.length > 0 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {chat.participant_names.join(', ')}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-gray-400 text-sm truncate max-w-md">{chat.last_message}</td>
                                <td className="p-4 text-gray-400 text-sm">
                                    {new Date(chat.last_message_time).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => viewChatMessages(chat.chat_id)}
                                            className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"
                                            title="View Messages"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteChat(chat.chat_id)}
                                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                                            title="Delete Chat"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {chats.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No chats found</div>
                )}
            </div>

            {/* Chat Messages Modal */}
            {selectedChat && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelectedChat(null)}>
                    <div className="bg-[#1E1E1E] rounded-xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Chat: {selectedChat}</h3>
                            <button onClick={() => setSelectedChat(null)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {messages.map((msg) => (
                                <div key={msg.id} className="bg-[#252525] p-3 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-[#FF00FF]">{msg.display_name || msg.sender_id}</span>
                                        <span className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="text-gray-300">{msg.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminChatsTab;
