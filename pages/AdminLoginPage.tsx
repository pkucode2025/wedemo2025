import React, { useState } from 'react';
import { Shield, Lock, ArrowRight } from 'lucide-react';

const AdminLoginPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('adminToken', data.token);
                window.location.href = '/admin';
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#1E1E1E] rounded-2xl border border-white/10 p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[#FF00FF]/20 rounded-full flex items-center justify-center mb-4 text-[#FF00FF]">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Access</h1>
                    <p className="text-gray-400 text-sm mt-2">Restricted Area</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#2A2A2A] text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF00FF] transition-all"
                                placeholder="Enter admin password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FF00FF] text-white py-3 rounded-xl font-medium hover:bg-[#D900D9] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Access Dashboard'}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;
