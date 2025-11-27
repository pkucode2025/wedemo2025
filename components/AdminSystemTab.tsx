import React, { useState } from 'react';
import { Settings, Database, Download, Upload, Trash2, RefreshCw, Shield, AlertTriangle } from 'lucide-react';

interface AdminSystemTabProps {
    token: string;
}

const AdminSystemTab: React.FC<AdminSystemTabProps> = ({ token }) => {
    const [loading, setLoading] = useState(false);

    const handleBulkDeleteUsers = async () => {
        if (!confirm('确定要删除所有非管理员用户吗？此操作不可恢复！')) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users/bulk-delete', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                alert('批量删除成功');
            } else {
                alert('批量删除失败');
            }
        } catch (error) {
            alert('操作失败');
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/export', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `export_${new Date().getTime()}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            alert('导出失败');
        } finally {
            setLoading(false);
        }
    };

    const handleClearCache = async () => {
        if (!confirm('确定要清除所有缓存吗？')) return;
        setLoading(true);
        try {
            await fetch('/api/admin/cache/clear', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('缓存已清除');
        } catch (error) {
            alert('清除失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6 text-[#FF00FF]" />
                系统设置
            </h2>

            {/* Database Operations */}
            <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#FF00FF]" />
                    数据库操作
                </h3>
                <div className="space-y-3">
                    <button
                        onClick={handleBulkDeleteUsers}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-600/30"
                    >
                        <Trash2 className="w-5 h-5" />
                        批量删除非管理员用户
                    </button>
                    <button
                        onClick={handleClearCache}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-xl transition-colors flex items-center justify-center gap-2 border border-yellow-600/30"
                    >
                        <RefreshCw className="w-5 h-5" />
                        清除系统缓存
                    </button>
                </div>
            </div>

            {/* Data Export */}
            <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-[#FF00FF]" />
                    数据导出
                </h3>
                <button
                    onClick={handleExportData}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#FF00FF]/20 hover:bg-[#FF00FF]/30 text-[#FF00FF] rounded-xl transition-colors flex items-center justify-center gap-2 border border-[#FF00FF]/30"
                >
                    <Download className="w-5 h-5" />
                    导出所有数据
                </button>
            </div>

            {/* Security Settings */}
            <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#FF00FF]" />
                    安全设置
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-lg">
                        <span className="text-gray-300">强制所有用户登出</span>
                        <button
                            onClick={async () => {
                                if (!confirm('确定要强制所有用户登出吗？')) return;
                                try {
                                    await fetch('/api/admin/security/force-logout', {
                                        method: 'POST',
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    alert('已强制所有用户登出');
                                } catch {
                                    alert('操作失败');
                                }
                            }}
                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm border border-red-600/30"
                        >
                            执行
                        </button>
                    </div>
                </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-yellow-400 text-sm">
                    <p className="font-semibold mb-1">警告</p>
                    <p>系统设置中的操作具有不可逆性，请谨慎操作。建议在执行重要操作前先备份数据。</p>
                </div>
            </div>
        </div>
    );
};

export default AdminSystemTab;

