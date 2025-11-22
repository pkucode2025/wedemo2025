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

    console.log(`[sendMessageToBackend] Sending message - chatId: ${chatId}, senderId: ${senderId}`);

    const response = await fetch('/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({ chatId, content, senderId }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
    }

    const data = await response.json();
    console.log(`[sendMessageToBackend] Message sent successfully:`, data.message);
    return data.message;
};

export const markChatAsRead = async (chatId: string, token: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const response = await fetch('/api/chats/mark-read', {
        method: 'POST',
        headers,
        body: JSON.stringify({ chatId }),
    });

    if (!response.ok) {
        console.error('[markChatAsRead] Failed to mark chat as read');
    }
};
