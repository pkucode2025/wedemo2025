import React, { useState } from 'react';
import { authApi } from '../services/authApi';
import { MessageSquare, ArrowLeft } from 'lucide-react';

interface ResetPasswordPageProps {
    onBack: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onBack }) => {
    const [step, setStep] = useState<'request' | 'reset'>('request');
    const [username, setUsername] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authApi.requestPasswordReset(username);
            setResetToken(response.resetToken);
            setSuccess('重置链接已生成！');
            setStep('reset');
        } catch (err: any) {
            setError(err.message || '请求失败');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('密码至少需要6个字符');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        setLoading(true);
        try {
            await authApi.resetPassword(resetToken, newPassword);
            setSuccess('密码重置成功！即将返回登录页...');
            setTimeout(() => {
                onBack();
            }, 2000);
        } catch (err: any) {
            setError(err.message || '重置失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl m-4">
                {/* Header */}
                <button
                    onClick={onBack}
                    className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
                >
                    <ArrowLeft className="w-5 h-5 mr-1" />
                    返回登录
                </button>

                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[#07C160] rounded-2xl flex items-center justify-center mb-4">
                        <MessageSquare className="w-10 h-10 text-white" fill="white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {step === 'request' ? '重置密码' : '设置新密码'}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {step === 'request' ? '输入您的用户名' : '输入您的新密码'}
                    </p>
                </div>

                {/* Request Reset Form */}
                {step === 'request' && (
                    <form onSubmit={handleRequestReset} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                用户名
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07C160] focus:border-transparent"
                                placeholder="请输入您的用户名"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-[#07C160] text-white rounded-lg font-medium hover:bg-[#06AD56] active:bg-[#059048] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? '请求中...' : '获取重置链接'}
                        </button>
                    </form>
                )}

                {/* Reset Password Form */}
                {step === 'reset' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                                {success}
                            </div>
                        )}

                        {/* Show reset token (demo only) */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800 mb-1 font-medium">重置Token（演示）：</p>
                            <p className="text-xs text-blue-600 font-mono break-all">{resetToken}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                新密码
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07C160] focus:border-transparent"
                                placeholder="至少6个字符"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                确认新密码
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07C160] focus:border-transparent"
                                placeholder="再次输入新密码"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-[#07C160] text-white rounded-lg font-medium hover:bg-[#06AD56] active:bg-[#059048] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? '重置中...' : '重置密码'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
