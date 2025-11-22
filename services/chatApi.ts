// 更新chatApi.ts以使用认证token

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

export { fetchMessages, sendMessageToBackend } from './api';
