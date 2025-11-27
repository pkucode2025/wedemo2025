// 认证相关API调用

interface RegisterData {
    username: string;
    password: string;
    displayName: string;
}

interface LoginData {
    username: string;
    password: string;
}

interface User {
    userId: string;
    username: string;
    displayName: string;
    avatar: string;
}

export const authApi = {
    // 注册
    async register(data: RegisterData): Promise<{ token: string; user: User }> {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '注册失败');
        }

        return response.json();
    },

    // 登录
    async login(data: LoginData): Promise<{ token: string; user: User }> {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '登录失败');
        }

        return response.json();
    },

    // 获取当前用户信息
    async getCurrentUser(token: string): Promise<User> {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('获取用户信息失败');
        }

        const data = await response.json();
        return data.user;
    },

    // 请求密码重置
    async requestPasswordReset(username: string): Promise<{ resetToken: string }> {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '请求失败');
        }

        return response.json();
    },

    // 重置密码
    async resetPassword(token: string, newPassword: string): Promise<void> {
        const response = await fetch('/api/auth/reset-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '重置失败');
        }
    },
};
