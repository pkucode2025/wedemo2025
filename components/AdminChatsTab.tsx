import React, { useState, useEffect } from 'react';
import { MessageCircle, Trash2, Eye, Search, X, Send, Edit2 } from 'lucide-react';

interface AdminChatsTabProps {
    token: string;
}

interface Chat {
    chat_id: string;
    last_message_time: string;
    message_count: number;
    last_message: string;
    participant_names?: string[];
    participants?: string[]; // Array of user_ids
}

interface Message {
    id: number;
    content: string;
    sender_id: string;
    display_name: string;
    avatar_url: string;
    created_at: string;
}

const AdminChatsTab: React.FC<AdminChatsTabProps> = ({ token }) => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    // Message control
    const [newMessage, setNewMessage] = useState('');
    const [selectedSender, setSelectedSender] = useState<string>('');
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [editContent, setEditContent] = useState('');

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

    const viewChatMessages = async (chat: Chat) => {
        try {
            const res = await fetch(`/api/admin/chats/${chat.chat_id}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                setSelectedChat(chat);
                // Default sender to first participant if available
                if (chat.participants && chat.participants.length > 0) {
                    setSelectedSender(chat.participants[0]);
                }
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

    const handleSendMessage = async () => {
        if (!selectedChat || !newMessage.trim() || !selectedSender) {
            alert('Please select a sender and enter a message');
            return;
        }

        try {
            const res = await fetch(`/api/admin/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    chatId: selectedChat.chat_id,
                    senderId: selectedSender,
                    content: newMessage
                })
            });

            if (res.ok) {
                setNewMessage('');
                viewChatMessages(selectedChat);
            } else {
                alert('Failed to send message');
            }
        } catch (error) {
            alert('Error sending message');
        }
    };

    const handleDeleteMessage = async (messageId: number) => {
        if (!confirm('Delete this message?')) return;
        try {
            await fetch(`/api/admin/messages/${messageId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (selectedChat) viewChatMessages(selectedChat);
        } catch {
            alert('Failed to delete message');
        }
    };

    const handleEditMessage = async () => {
        if (!editingMessage || !editContent.trim()) return;

        try {
            const res = await fetch(`/api/admin/messages/${editingMessage.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: editContent })
            });

            if (res.ok) {
                setEditingMessage(null);
                setEditContent('');
                if (selectedChat) viewChatMessages(selectedChat);
            } else {
                alert('Failed to update message');
            }
        } catch {
            alert('Error updating message');
        }
    };

    if (loading) return <div className="text-gray-400 p-4">Loading chats...</div>;

    return (
        <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Chat Management</h2>

            <div className="bg-[#1E1E1E] rounded-xl border border-white/10 overflow-x-auto">
                <table className="w-full min-w-[800px]">
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
                                            onClick={() => viewChatMessages(chat)}
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
                    <div className="bg-[#1E1E1E] rounded-xl border border-white/10 w-full max-w-4xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <h3 className="text-xl font-bold text-white">Chat: {selectedChat.chat_id}</h3>
                            <button onClick={() => setSelectedChat(null)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Messages */}
                            <div className="space-y-3 mb-6">
                                {messages.map((msg) => (
                                    <div key={msg.id} className="bg-[#252525] p-4 rounded-lg group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-[#FF00FF]">{msg.display_name || msg.sender_id}</span>
                                                <span className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingMessage(msg);
                                                        setEditContent(msg.content);
                                                    }}
                                                    className="p-1 hover:bg-blue-500/20 text-blue-400 rounded"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="p-1 hover:bg-red-500/20 text-red-400 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-gray-300 whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Send Message Area */}
                            <div className="bg-[#252525] p-4 rounded-xl border border-white/10 sticky bottom-0">
                                <h4 className="text-sm font-medium text-gray-400 mb-3">Send Message As...</h4>
                                <div className="flex gap-3">
                                    <select
                                        value={selectedSender}
                                        onChange={(e) => setSelectedSender(e.target.value)}
                                        className="bg-[#1E1E1E] text-white px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#FF00FF] max-w-[200px]"
                                    >
                                        <option value="">Select Participant</option>
                                        {selectedChat.participants?.map(pid => (
                                            <option key={pid} value={pid}>{selectedChat.participant_names?.[selectedChat.participants.indexOf(pid)] || pid}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#FF00FF]"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="bg-[#FF00FF] text-white px-4 py-2 rounded-lg hover:bg-[#D900D9] transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Message Modal */}
            {editingMessage && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]">
                    <div className="bg-[#1E1E1E] p-6 rounded-xl w-full max-w-lg border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Edit Message</h3>
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full h-32 bg-[#252525] text-white p-3 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#FF00FF] mb-4 resize-none"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setEditingMessage(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditMessage}
                                className="px-4 py-2 bg-[#FF00FF] text-white rounded-lg hover:bg-[#D900D9]"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminChatsTab;
