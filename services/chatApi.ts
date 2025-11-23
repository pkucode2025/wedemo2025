import { Message } from '../types';

export const fetchChats = async (token: string) => {
    const response = await fetch('/api/chats', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch chats');
    return response.json();
};

export const markChatAsRead = async (chatId: string, token: string) => {
    const response = await fetch('/api/chats/mark-read', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chatId })
    });
    if (!response.ok) throw new Error('Failed to mark chat as read');
    return response.json();
};

export const fetchMessages = async (chatId: string, token?: string) => {
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/messages?chatId=${chatId}`, {
        headers
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
};

export const sendMessageToBackend = async (chatId: string, content: string, senderId: string, token: string) => {
    const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            chatId,
            content,
            senderId
        })
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
};

export const chatApi = {
    async clearHistory(chatId: string, token: string) {
        const response = await fetch('/api/chats/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ chatId })
        });
        if (!response.ok) throw new Error('Failed to clear history');
        return response.json();
    },

    async deleteFriend(friendId: string, token: string) {
        const response = await fetch('/api/friends/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ friendId })
        });
        if (!response.ok) throw new Error('Failed to delete friend');
        return response.json();
    }
};
