import React, { useState, useEffect } from 'react';
import { Users, Trash2, Eye, X, MessageSquare, Send, Edit2 } from 'lucide-react';

interface AdminGroupsTabProps {
    token: string;
}

interface Group {
    group_id: string;
    name: string;
    owner_name: string;
    member_count: number;
    message_count: number;
    created_at: string;
}

interface GroupMember {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string;
}

interface Message {
    id: number;
    content: string;
    sender_id: string;
    display_name: string;
    avatar_url: string;
    created_at: string;
}

const AdminGroupsTab: React.FC<AdminGroupsTabProps> = ({ token }) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [viewMode, setViewMode] = useState<'members' | 'messages' | null>(null);

    // Message control state
    const [newMessage, setNewMessage] = useState('');
    const [selectedSender, setSelectedSender] = useState<string>('');
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/groups', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGroups(data.groups || []);
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async (groupId: string) => {
        try {
            const res = await fetch(`/api/admin/groups/${groupId}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members || []);
            }
        } catch (error) {
            console.error('Failed to fetch members:', error);
        }
    };

    const fetchMessages = async (groupId: string) => {
        try {
            const res = await fetch(`/api/admin/groups/${groupId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const handleViewMembers = async (group: Group) => {
        setSelectedGroup(group);
        setViewMode('members');
        await fetchMembers(group.group_id);
    };

    const handleViewMessages = async (group: Group) => {
        setSelectedGroup(group);
        setViewMode('messages');
        await Promise.all([
            fetchMembers(group.group_id), // Fetch members for sender selection
            fetchMessages(group.group_id)
        ]);
    };

    const deleteGroup = async (groupId: string) => {
        if (!confirm('Are you sure you want to delete this group and all its data?')) return;

        try {
            await fetch(`/api/admin/groups/${groupId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchGroups();
        } catch (error) {
            alert('Failed to delete group');
        }
    };

    const removeMember = async (groupId: string, userId: string) => {
        if (!confirm('Remove this member from the group?')) return;

        try {
            await fetch(`/api/admin/groups/${groupId}/members/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMembers(groupId);
        } catch (error) {
            alert('Failed to remove member');
        }
    };

    const handleSendMessage = async () => {
        if (!selectedGroup || !newMessage.trim() || !selectedSender) {
            alert('Please select a sender and enter a message');
            return;
        }

        try {
            const res = await fetch(`/api/admin/groups/${selectedGroup.group_id}/send-as`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: selectedSender,
                    content: newMessage
                })
            });

            if (res.ok) {
                setNewMessage('');
                fetchMessages(selectedGroup.group_id);
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
            if (selectedGroup) fetchMessages(selectedGroup.group_id);
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
                if (selectedGroup) fetchMessages(selectedGroup.group_id);
            } else {
                alert('Failed to update message');
            }
        } catch {
            alert('Error updating message');
        }
    };

    if (loading) return <div className="text-gray-400 p-4">Loading groups...</div>;

    return (
        <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Group Management</h2>

            <div className="bg-[#1E1E1E] rounded-xl border border-white/10 overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-[#252525] border-b border-white/10">
                        <tr>
                            <th className="text-left p-4 text-gray-400 font-medium">Group Name</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Owner</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Members</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Messages</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Created</th>
                            <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map((group) => (
                            <tr key={group.group_id} className="border-b border-white/5 hover:bg-[#252525] transition-colors">
                                <td className="p-4 text-white font-semibold">{group.name}</td>
                                <td className="p-4 text-gray-300">{group.owner_name}</td>
                                <td className="p-4 text-gray-300">{group.member_count}</td>
                                <td className="p-4 text-gray-300">{group.message_count}</td>
                                <td className="p-4 text-gray-400 text-sm">
                                    {new Date(group.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleViewMembers(group)}
                                            className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"
                                            title="View Members"
                                        >
                                            <Users className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleViewMessages(group)}
                                            className="p-2 hover:bg-purple-500/20 rounded-lg text-purple-400 transition-colors"
                                            title="View Messages"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteGroup(group.group_id)}
                                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                                            title="Delete Group"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {groups.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No groups found</div>
                )}
            </div>

            {/* Modal */}
            {selectedGroup && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelectedGroup(null)}>
                    <div className="bg-[#1E1E1E] rounded-xl border border-white/10 w-full max-w-4xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <h3 className="text-xl font-bold text-white">
                                {viewMode === 'members' ? 'Members: ' : 'Chat: '}
                                {selectedGroup.name}
                            </h3>
                            <button onClick={() => setSelectedGroup(null)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {viewMode === 'members' ? (
                                <div className="space-y-2">
                                    {members.map((member) => (
                                        <div key={member.user_id} className="bg-[#252525] p-3 rounded-lg flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <img src={member.avatar_url} className="w-10 h-10 rounded-full bg-gray-700" />
                                                <div>
                                                    <div className="font-semibold text-white">{member.display_name}</div>
                                                    <div className="text-xs text-gray-500">@{member.username}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeMember(selectedGroup.group_id, member.user_id)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Message List */}
                                    <div className="space-y-3 mb-6">
                                        {messages.map((msg) => (
                                            <div key={msg.id} className="bg-[#252525] p-4 rounded-lg group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <img src={msg.avatar_url} className="w-6 h-6 rounded-full bg-gray-700" />
                                                        <span className="font-semibold text-[#FF00FF]">{msg.display_name}</span>
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
                                                <option value="">Select Member</option>
                                                {members.map(m => (
                                                    <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
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
                            )}
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

export default AdminGroupsTab;
