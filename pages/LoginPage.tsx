import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare } from 'lucide-react';

interface LoginPageProps {
    onSwitchToRegister: () => void;
    onSwitchToReset: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister, onSwitchToReset }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
        } catch (err: any) {
            setError(err.message || '登录失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl m-4">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[#07C160] rounded-2xl flex items-center justify-center mb-4">
                        <MessageSquare className="w-10 h-10 text-white" fill="white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">微信</h1>
                    <p className="text-gray-500 mt-2">登录您的账号</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
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
                            placeholder="请输入用户名"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            密码
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07C160] focus:border-transparent"
                            placeholder="请输入密码"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#07C160] text-white rounded-lg font-medium hover:bg-[#06AD56] active:bg-[#059048] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? '登录中...' : '登录'}
                    </button>
                </form>

                {/* Links */}
                <div className="mt-6 flex justify-between text-sm">
                    <button
                        onClick={onSwitchToReset}
                        className="text-[#07C160] hover:underline"
                    >
                        忘记密码？
                    </button>
                    <button
                        onClick={onSwitchToRegister}
                        className="text-[#07C160] hover:underline"
                    >
                        注册新账号
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
