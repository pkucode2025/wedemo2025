import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Camera, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { imageService } from '../services/imageService';

interface EditProfilePageProps {
    onClose: () => void;
}

const EditProfilePage: React.FC<EditProfilePageProps> = ({ onClose }) => {
    const { user, token, refreshUser } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setBio(user.bio || '');
            setAvatar(user.avatar || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!token) {
            alert('请先登录');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/me/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    displayName,
                    bio,
                    avatar_url: avatar
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '更新失败');
            }

            // 刷新用户信息
            if (refreshUser) {
                await refreshUser();
            }

            alert('保存成功！');
            onClose();
        } catch (error: any) {
            console.error('保存失败:', error);
            alert(error.message || '保存失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 验证文件
        const validation = imageService.validateImage(file, 5);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        setUploading(true);
        try {
            // 转换为base64
            const base64 = await imageService.convertToBase64(file);
            setAvatar(base64);
        } catch (error) {
            console.error('上传头像失败:', error);
            alert('上传头像失败，请重试');
        } finally {
            setUploading(false);
            // 清空input以便可以再次选择同一文件
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-[#121212] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-[50px] bg-[#1E1E1E] border-b border-white/10 flex items-center px-3 justify-between flex-shrink-0">
                <button
                    onClick={onClose}
                    className="flex items-center text-white"
                >
                    <ChevronLeft className="w-6 h-6" strokeWidth={2} />
                    <span className="text-[16px]">返回</span>
                </button>

                <span className="text-[17px] font-medium text-white">编辑资料</span>

                <button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className="text-[#FF00FF] text-[16px] font-medium disabled:opacity-50"
                >
                    {saving ? '保存中...' : '完成'}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#121212] min-h-0">
                {/* Avatar */}
                <div className="bg-[#1E1E1E] mb-2 px-4 py-3 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <span className="text-[17px] text-white">头像</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div
                            className="relative cursor-pointer group"
                            onClick={handleAvatarClick}
                        >
                            <img
                                src={avatar || 'https://picsum.photos/id/64/200/200'}
                                alt="Avatar"
                                className="w-20 h-20 rounded-full object-cover border-2 border-[#FF00FF]/30"
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {uploading ? (
                                    <div className="text-white text-xs">上传中...</div>
                                ) : (
                                    <Upload className="w-6 h-6 text-white" />
                                )}
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">点击头像上传新头像（支持JPG、PNG、GIF、WebP，最大5MB）</p>
                </div>

                {/* Display Name */}
                <div className="bg-[#1E1E1E] mb-2 border-b border-white/5">
                    <div className="px-4 py-3">
                        <div className="text-[14px] text-gray-400 mb-2">名字</div>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full text-[17px] outline-none bg-transparent text-white placeholder-gray-500"
                            placeholder="请输入名字"
                            maxLength={20}
                        />
                    </div>
                </div>

                {/* User ID (Read Only) */}
                <div className="bg-[#1E1E1E] mb-2 border-b border-white/5">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[17px] text-white">用户ID</span>
                        <span className="text-[17px] text-gray-400">{user?.userId}</span>
                    </div>
                    <p className="px-4 pb-2 text-xs text-gray-500">用户ID不可修改</p>
                </div>

                {/* Bio */}
                <div className="bg-[#1E1E1E] mb-2 border-b border-white/5">
                    <div className="px-4 py-3">
                        <div className="text-[14px] text-gray-400 mb-2">个性签名</div>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full text-[17px] outline-none resize-none bg-transparent text-white placeholder-gray-500"
                            placeholder="填写个性签名"
                            rows={3}
                            maxLength={100}
                        />
                        <div className="text-xs text-gray-500 text-right mt-1">
                            {bio.length}/100
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="px-4 py-3 text-xs text-gray-400">
                    <p className="text-[#FF00FF] mb-2">💡 提示：</p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li>账号和密码无法在此修改</li>
                        <li>头像支持JPG、PNG、GIF、WebP格式，最大5MB</li>
                        <li>修改后点击"完成"保存</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;
