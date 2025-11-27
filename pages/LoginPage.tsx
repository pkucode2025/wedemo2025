import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Lock, User } from 'lucide-react';

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
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-[#121212] relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#FF00FF]/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#8A2BE2]/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md p-8 bg-[#1E1E1E]/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl m-4 relative z-10">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-tr from-[#FF00FF] to-[#8A2BE2] rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,0,255,0.3)] transform rotate-3 hover:rotate-6 transition-transform duration-300">
                        <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">NeonChat</h1>
                    <p className="text-gray-400 mt-2">Enter the digital realm</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center backdrop-blur-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FF00FF] transition-colors" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[#111111] border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FF00FF]/60 focus:ring-1 focus:ring-[#FF00FF]/60 transition-all caret-white"
                                style={{ WebkitTextFillColor: 'white', caretColor: 'white' }}
                                placeholder="Username"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#8A2BE2] transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[#111111] border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8A2BE2]/60 focus:ring-1 focus:ring-[#8A2BE2]/60 transition-all caret-white"
                                style={{ WebkitTextFillColor: 'white', caretColor: 'white' }}
                                placeholder="Password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-[#FF00FF] to-[#8A2BE2] text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:shadow-[0_0_30px_rgba(255,0,255,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                {/* Links */}
                <div className="mt-8 flex items-center justify-between text-sm">
                    <button
                        onClick={onSwitchToReset}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        Forgot Password?
                    </button>
                    <button
                        onClick={onSwitchToRegister}
                        className="text-[#FF00FF] hover:text-[#FF00FF]/80 font-medium transition-colors"
                    >
                        Create Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
