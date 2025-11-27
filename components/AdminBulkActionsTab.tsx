import React, { useState } from 'react';
import { Users, Image, MessageSquare, Trash2, Ban, CheckCircle, XCircle } from 'lucide-react';

interface AdminBulkActionsTabProps {
    token: string;
}

const AdminBulkActionsTab: React.FC<AdminBulkActionsTabProps> = ({ token }) => {
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [selectedMoments, setSelectedMoments] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);

    const handleBulkBanUsers = async () => {
        if (selectedUsers.size === 0) {
            alert('请先选择用户');
            return;
        }
        if (!confirm(`确定要封禁选中的 ${selectedUsers.size} 个用户吗？`)) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users/bulk-ban', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userIds: Array.from(selectedUsers) })
            });
            if (res.ok) {
                alert('批量封禁成功');
                setSelectedUsers(new Set());
            } else {
                alert('批量封禁失败');
            }
        } catch (error) {
            alert('操作失败');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDeleteMoments = async () => {
        if (selectedMoments.size === 0) {
            alert('请先选择动态');
            return;
        }
        if (!confirm(`确定要删除选中的 ${selectedMoments.size} 条动态吗？`)) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/moments/bulk-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ momentIds: Array.from(selectedMoments) })
            });
            if (res.ok) {
                alert('批量删除成功');
                setSelectedMoments(new Set());
            } else {
                alert('批量删除失败');
            }
        } catch (error) {
            alert('操作失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-[#FF00FF]" />
                批量操作
            </h2>

            <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#FF00FF]" />
                    用户批量操作
                </h3>
                <div className="space-y-3">
                    <div className="text-sm text-gray-400 mb-4">
                        已选择 {selectedUsers.size} 个用户
                    </div>
                    <button
                        onClick={handleBulkBanUsers}
                        disabled={loading || selectedUsers.size === 0}
                        className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-600/30 disabled:opacity-50"
                    >
                        <Ban className="w-5 h-5" />
                        批量封禁选中用户
                    </button>
                </div>
            </div>

            <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-[#FF00FF]" />
                    动态批量操作
                </h3>
                <div className="space-y-3">
                    <div className="text-sm text-gray-400 mb-4">
                        已选择 {selectedMoments.size} 条动态
                    </div>
                    <button
                        onClick={handleBulkDeleteMoments}
                        disabled={loading || selectedMoments.size === 0}
                        className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-600/30 disabled:opacity-50"
                    >
                        <Trash2 className="w-5 h-5" />
                        批量删除选中动态
                    </button>
                </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-blue-400 text-sm">
                <p>💡 提示：批量操作功能需要在对应的管理页面中选择项目后使用。</p>
            </div>
        </div>
    );
};

export default AdminBulkActionsTab;

