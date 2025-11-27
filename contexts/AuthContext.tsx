import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/authApi';

interface User {
    userId: string;
    username: string;
    displayName: string;
    avatar: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, displayName: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // 初始化：从localStorage恢复登录状态
    useEffect(() => {
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
            console.log('[Auth] Found saved token, validating...');
            authApi.getCurrentUser(savedToken)
                .then(user => {
                    console.log('[Auth] Token valid, user restored:', user);
                    setUser(user);
                    setToken(savedToken);
                })
                .catch(err => {
                    console.log('[Auth] Token invalid, clearing:', err);
                    localStorage.removeItem('auth_token');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username: string, password: string) => {
        try {
            console.log('[Auth] Logging in...');
            const response = await authApi.login({ username, password });
            console.log('[Auth] Login successful:', response.user);

            setUser(response.user);
            setToken(response.token);
            localStorage.setItem('auth_token', response.token);
        } catch (error) {
            console.error('[Auth] Login failed:', error);
            throw error;
        }
    };

    const register = async (username: string, password: string, displayName: string) => {
        try {
            console.log('[Auth] Registering...');
            const response = await authApi.register({ username, password, displayName });
            console.log('[Auth] Registration successful:', response.user);

            setUser(response.user);
            setToken(response.token);
            localStorage.setItem('auth_token', response.token);
        } catch (error) {
            console.error('[Auth] Registration failed:', error);
            throw error;
        }
    };

    const logout = () => {
        console.log('[Auth] Logging out');
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
    };

    const refreshUser = async () => {
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
            try {
                const updatedUser = await authApi.getCurrentUser(savedToken);
                setUser(updatedUser);
            } catch (error) {
                console.error('[Auth] Failed to refresh user:', error);
            }
        }
    };

    const value: AuthContextType = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
