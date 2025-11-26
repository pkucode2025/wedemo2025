import React, { useState } from 'react';
import { ChevronLeft, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EditProfilePageProps {
    onClose: () => void;
}

const EditProfilePage: React.FC<EditProfilePageProps> = ({ onClose }) => {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // TODO: 实现保存功能到后端API
        console.log('[EditProfile] Saving:', { displayName, bio, avatar });

        // 模拟保存延迟
        await new Promise(resolve => setTimeout(resolve, 500));

        setSaving(false);
        onClose();
    };

    const handleChangeAvatar = () => {
        // 简化版：随机更换头像
        const randomId = Math.floor(Math.random() * 100);
        setAvatar(`https://picsum.photos/id/${randomId}/200/200`);
    };

    return (
        <div className="absolute inset-0 z-50 bg-white flex flex-col">
            {/* Header */}
            <div className="h-[50px] bg-[#EDEDED] border-b border-gray-300 flex items-center px-3 justify-between flex-shrink-0">
                <button
                    onClick={onClose}
                    className="flex items-center text-black"
                >
                    <ChevronLeft className="w-6 h-6" strokeWidth={2} />
                    <span className="text-[16px]">返回</span>
                </button>

                <span className="text-[17px] font-medium">编辑资料</span>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-[#07C160] text-[16px] font-medium disabled:opacity-50"
                >
                    {saving ? '保存中...' : '完成'}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#EDEDED]">
                {/* Avatar */}
                <div className="bg-white mb-2 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[17px]">头像</span>
                        <div
                            className="relative cursor-pointer"
                            onClick={handleChangeAvatar}
                        >
                            <img
                                src={avatar}
                                alt="Avatar"
                                className="w-16 h-16 rounded-md object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 rounded-md flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">点击头像更换（演示）</p>
                </div>

                {/* Display Name */}
                <div className="bg-white mb-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-[14px] text-gray-500 mb-2">名字</div>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full text-[17px] outline-none"
                            placeholder="请输入名字"
                            maxLength={20}
                        />
                    </div>
                </div>

                {/* WeChat ID (Read Only) */}
                <div className="bg-white mb-2">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[17px]">微信号</span>
                        <span className="text-[17px] text-gray-500">{user?.userId}</span>
                    </div>
                    <p className="px-4 pb-2 text-xs text-gray-500">微信号不可修改</p>
                </div>

                {/* Bio */}
                <div className="bg-white mb-2">
                    <div className="px-4 py-3">
                        <div className="text-[14px] text-gray-500 mb-2">个性签名</div>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full text-[17px] outline-none resize-none"
                            placeholder="填写个性签名"
                            rows={3}
                            maxLength={100}
                        />
                        <div className="text-xs text-gray-400 text-right mt-1">
                            {bio.length}/100
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="px-4 py-3 text-xs text-gray-500">
                    <p>💡 提示：</p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li>账号和密码无法在此修改</li>
                        <li>头像点击可更换（演示版随机图片）</li>
                        <li>修改后点击"完成"保存</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;
