export const fetchChats = async () => {
    console.log('[API] Fetching chat list');
    try {
        const response = await fetch('/api/chats');
        if (!response.ok) {
            throw new Error('Failed to fetch chats');
        }
        const data = await response.json();
        console.log('[API] Received chats:', data.chats);
        return data.chats;
    } catch (error) {
        console.error('[API] Error fetching chats:', error);
        return [];
    }
};

export { fetchMessages, sendMessageToBackend } from './api';
