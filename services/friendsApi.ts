// 好友相关API调用

export const friendsApi = {
    // 搜索用户（使用 /api/friends?q=...）
    async searchUsers(query: string, token: string) {
        const response = await fetch(`/api/friends?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '搜索失败');
        }

        const data = await response.json();
        return data.users;
    },

    // 获取好友列表
    async getFriends(token: string) {
        const response = await fetch('/api/friends', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '获取好友列表失败');
        }

        return response.json();
    },

    // 直接添加好友（不走申请）
    async addFriend(friendUserId: string, token: string) {
        const response = await fetch('/api/friends', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ friendUserId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '添加好友失败');
        }

        return response.json();
    },

    // 发送好友申请
    async sendFriendRequest(toUserId: string, token: string, message?: string) {
        const response = await fetch('/api/friends/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ toUserId, message }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '发送好友申请失败');
        }

        return response.json();
    },

    // 删除好友
    async removeFriend(friendUserId: string, token: string) {
        const response = await fetch('/api/friends', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ friendUserId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '删除好友失败');
        }

        return response.json();
    },
};

// 更新聊天API以包含认证
export const fetchChatsWithAuth = async (token: string) => {
    const response = await fetch('/api/chats', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch chats');
    }

    const data = await response.json();
    return data.chats;
};
