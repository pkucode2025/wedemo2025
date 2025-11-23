import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, User, Lock, Smile } from 'lucide-react';

interface RegisterPageProps {
    onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await register(username, password, displayName);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-[#121212] relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#FF00FF]/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#8A2BE2]/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md p-8 bg-[#1E1E1E]/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl m-4 relative z-10">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-[#FF00FF] to-[#8A2BE2] rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,0,255,0.3)]">
                        <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Join NeonChat</h1>
                    <p className="text-gray-400 mt-2">Start your digital journey</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center backdrop-blur-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#FF00FF] transition-colors" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[#121212]/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#FF00FF]/50 focus:ring-1 focus:ring-[#FF00FF]/50 transition-all"
                                placeholder="Username"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Smile className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#FF00FF] transition-colors" />
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[#121212]/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#FF00FF]/50 focus:ring-1 focus:ring-[#FF00FF]/50 transition-all"
                                placeholder="Display Name"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#8A2BE2] transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[#121212]/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#8A2BE2]/50 focus:ring-1 focus:ring-[#8A2BE2]/50 transition-all"
                                placeholder="Password (min 6 chars)"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#8A2BE2] transition-colors" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[#121212]/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#8A2BE2]/50 focus:ring-1 focus:ring-[#8A2BE2]/50 transition-all"
                                placeholder="Confirm Password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-[#FF00FF] to-[#8A2BE2] text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:shadow-[0_0_30px_rgba(255,0,255,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                {/* Link */}
                <div className="mt-8 text-center text-sm">
                    <span className="text-gray-400">Already have an account?</span>
                    <button
                        onClick={onSwitchToLogin}
                        className="ml-2 text-[#FF00FF] hover:text-[#FF00FF]/80 font-medium transition-colors"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
