import React from 'react';
import { ChevronLeft, Search, Bell, User, Trash2, Shield, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Partner {
    userId: string;
    name: string;
    avatar: string;
}

interface ChatDetailsProps {
    partner: Partner;
    onBack: () => void;
    onViewProfile: () => void;
    onClearHistory: () => void;
    onDeleteContact: () => void;
}

const ChatDetails: React.FC<ChatDetailsProps> = ({
    partner,
    onBack,
    onViewProfile,
    onClearHistory,
    onDeleteContact
}) => {
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

    const ToggleRow = ({ label }: { label: string }) => (
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
            <span className="text-[16px]">{label}</span>
            <div className="w-12 h-7 bg-gray-200 rounded-full relative cursor-pointer">
                <div className="w-6 h-6 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
            </div>
        </div>
    );

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
                    <div className="flex flex-col items-center w-[60px]" onClick={onViewProfile}>
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
                    <OptionRow label="查找聊天记录" icon={Search} />
                </div>

                {/* Settings Group 2 */}
                <div className="mb-2">
                    <ToggleRow label="消息免打扰" />
                    <ToggleRow label="置顶聊天" />
                    <ToggleRow label="提醒" />
                </div>

                {/* Settings Group 3 */}
                <div className="mb-2">
                    <OptionRow label="设置当前聊天背景" icon={FileText} />
                </div>

                {/* Settings Group 4 */}
                <div className="mb-2">
                    <OptionRow
                        label="清空聊天记录"
                        icon={Trash2}
                        onClick={() => {
                            if (confirm('确定要清空聊天记录吗？')) onClearHistory();
                        }}
                    />
                </div>

                {/* Settings Group 5 */}
                <div className="mb-4">
                    <OptionRow label="投诉" icon={Shield} />
                    <ToggleRow label="加入黑名单" />
                </div>

                <div className="px-4">
                    <button
                        onClick={() => {
                            if (confirm('确定要删除该联系人吗？')) onDeleteContact();
                        }}
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
