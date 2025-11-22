// 聊天相关API调用

export const fetchChats = async (token?: string) => {
    const headers: Record<string, string> = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/chats', { headers });

    if (!response.ok) {
        throw new Error('Failed to fetch chats');
    }

    const data = await response.json();
    return data.chats;
};

export const fetchMessages = async (chatId: string, token?: string) => {
    const headers: Record<string, string> = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/messages?chatId=${encodeURIComponent(chatId)}`, { headers });

    if (!response.ok) {
        throw new Error('Failed to fetch messages');
    }

    const data = await response.json();
    return data.messages;
};

export const sendMessageToBackend = async (chatId: string, content: string, senderId: string, token?: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({ chatId, content, senderId }),
    });

    if (!response.ok) {
        throw new Error('Failed to send message');
    }

    const data = await response.json();
    return data.message;
};

// 获取用户信息
export const getUserInfo = async (userId: string, token: string) => {
    const response = await fetch(`/api/users/${userId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return data.user;
};
