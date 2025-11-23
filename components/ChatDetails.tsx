import React, { useState } from 'react';
import { ChevronLeft, Search, Bell, User, Trash2, Shield, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../services/chatApi';

interface Partner {
    userId: string;
    name: string;
    avatar: string;
}

interface ChatDetailsProps {
    partner: Partner;
    chatId: string;
    onBack: () => void;
    onViewProfile: () => void;
    onClearHistory: () => void;
    onDeleteContact: () => void;
}

const ChatDetails: React.FC<ChatDetailsProps> = ({
    partner,
    chatId,
    onBack,
    onViewProfile,
    onClearHistory,
    onDeleteContact
}) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        isMuted: false,
        isSticky: false
    });

    const handleSettingChange = async (setting: 'is_muted' | 'is_sticky', value: boolean) => {
        if (!token) return;
        try {
            // Call API
            const response = await fetch('/api/chats/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ chatId, setting, value })
            });

            if (response.ok) {
                setSettings(prev => ({
                    ...prev,
                    [setting === 'is_muted' ? 'isMuted' : 'isSticky']: value
                }));
            }
        } catch (error) {
            console.error('Failed to update setting:', error);
        }
    };

    const handleClearHistory = async () => {
        if (!confirm('确定要清空聊天记录吗？') || !token) return;

        setLoading(true);
        try {
            await chatApi.clearHistory(chatId, token);
            onClearHistory();
            alert('聊天记录已清空');
        } catch (error) {
            console.error('Failed to clear history:', error);
            alert('操作失败');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteContact = async () => {
        if (!confirm('确定要删除该联系人吗？删除后将同时删除聊天记录。') || !token) return;

        setLoading(true);
        try {
            await chatApi.deleteFriend(partner.userId, token);
            onDeleteContact();
            alert('联系人已删除');
        } catch (error) {
            console.error('Failed to delete contact:', error);
            alert('操作失败');
        } finally {
            setLoading(false);
        }
    };

    const OptionRow = ({ label, icon: Icon, onClick, isDestructive = false, value = '' }: any) => (
        <div
            onClick={onClick}
            className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between active:bg-gray-50 cursor-pointer"
        >
            <div className="flex items-center">
                {Icon && <Icon className={`w-5 h-5 mr-3 ${isDestructive ? 'text-red-500' : 'text-gray-600'}`} />}
                <span className={`text-[16px] ${isDestructive ? 'text-red-500' : 'text-black'}`}>{label}</span>
            </div>
            <div className="flex items-center">
                {value && <span className="text-gray-400 text-sm mr-2">{value}</span>}
                <div className="w-2 h-2 border-t-2 border-r-2 border-gray-300 rotate-45" />
            </div>
        </div>
    );

    const ToggleRow = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) => (
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
            <span className="text-[16px]">{label}</span>
            <div
                className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${checked ? 'bg-[#07C160]' : 'bg-gray-200'}`}
                onClick={() => onChange(!checked)}
            >
                <div
                    className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${checked ? 'left-[22px]' : 'left-0.5'}`}
                />
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="absolute inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
                <div className="bg-white p-4 rounded-md">处理中...</div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-50 bg-[#EDEDED] flex flex-col">
            {/* Header */}
            <div className="h-[50px] bg-[#EDEDED] border-b border-gray-300 flex items-center px-3 relative flex-shrink-0">
                <button onClick={onBack} className="flex items-center text-black absolute left-3">
                    <ChevronLeft className="w-6 h-6" strokeWidth={2} />
                    <span className="text-[16px]">返回</span>
                </button>
                <span className="text-[17px] font-medium w-full text-center">聊天详情</span>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Members */}
                <div className="bg-white p-4 mb-2 flex flex-wrap gap-4">
                    <div className="flex flex-col items-center w-[60px] cursor-pointer" onClick={onViewProfile}>
                        <img
                            src={partner.avatar}
                            className="w-[50px] h-[50px] rounded-md object-cover mb-1"
                            alt={partner.name}
                        />
                        <span className="text-[12px] text-gray-500 truncate w-full text-center">{partner.name}</span>
                    </div>
                    <div className="flex flex-col items-center w-[60px]">
                        <div className="w-[50px] h-[50px] border border-gray-300 rounded-md flex items-center justify-center text-gray-400">
                            <span className="text-2xl">+</span>
                        </div>
                    </div>
                </div>

                {/* Settings Group 1 */}
                <div className="mb-2">
                    <OptionRow label="查找聊天记录" icon={Search} onClick={() => alert('功能开发中')} />
                </div>

                {/* Settings Group 2 */}
                <div className="mb-2">
                    <ToggleRow
                        label="消息免打扰"
                        checked={settings.isMuted}
                        onChange={(val) => handleSettingChange('is_muted', val)}
                    />
                    <ToggleRow
                        label="置顶聊天"
                        checked={settings.isSticky}
                        onChange={(val) => handleSettingChange('is_sticky', val)}
                    />
                    <ToggleRow
                        label="提醒"
                        checked={false}
                        onChange={() => { }}
                    />
                </div>

                {/* Settings Group 3 */}
                <div className="mb-2">
                    <OptionRow label="设置当前聊天背景" icon={FileText} onClick={() => alert('功能开发中')} />
                </div>

                {/* Settings Group 4 */}
                <div className="mb-2">
                    <OptionRow
                        label="清空聊天记录"
                        icon={Trash2}
                        onClick={handleClearHistory}
                    />
                </div>

                {/* Settings Group 5 */}
                <div className="mb-4">
                    <OptionRow label="投诉" icon={Shield} onClick={() => alert('功能开发中')} />
                </div>

                <div className="px-4 pb-8">
                    <button
                        onClick={handleDeleteContact}
                        className="w-full py-3 bg-white text-red-500 text-[17px] font-medium rounded-md active:bg-gray-50"
                    >
                        删除联系人
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatDetails;
