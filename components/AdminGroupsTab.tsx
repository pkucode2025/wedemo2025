import React, { useState, useEffect } from 'react';
import { Users, Trash2, Eye, X } from 'lucide-react';

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

const AdminGroupsTab: React.FC<AdminGroupsTabProps> = ({ token }) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<any[]>([]);

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

    const viewGroupMembers = async (group: Group) => {
        try {
            const res = await fetch(`/api/admin/groups/${group.group_id}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members || []);
                setSelectedGroup(group);
            }
        } catch (error) {
            console.error('Failed to fetch members:', error);
        }
    };

    const deleteGroup = async (groupId: string) => {
        if (!confirm('Delete this group and all its data?')) return;

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
            viewGroupMembers(selectedGroup!);
        } catch (error) {
            alert('Failed to remove member');
        }
    };

    if (loading) return <div className="text-gray-400 p-4">Loading groups...</div>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Group Management</h2>

            <div className="bg-[#1E1E1E] rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
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
                                            onClick={() => viewGroupMembers(group)}
                                            className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"
                                            title="View Members"
                                        >
                                            <Users className="w-4 h-4" />
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

            {/* Group Members Modal */}
            {selectedGroup && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelectedGroup(null)}>
                    <div className="bg-[#1E1E1E] rounded-xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Members: {selectedGroup.name}</h3>
                            <button onClick={() => setSelectedGroup(null)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {members.map((member) => (
                                <div key={member.user_id} className="bg-[#252525] p-3 rounded-lg flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <img src={member.avatar_url} className="w-10 h-10 rounded-full" />
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminGroupsTab;
