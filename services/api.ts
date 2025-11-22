import { Message } from '../types';

export const fetchMessages = async (chatId: string): Promise<Message[]> => {
    try {
        const response = await fetch(`/api/messages?chatId=${chatId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        return data.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.sender_id,
            timestamp: new Date(msg.created_at).getTime(),
            type: 'text', // Defaulting to text for now
        }));
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
};

export const sendMessageToBackend = async (chatId: string, content: string, senderId: string): Promise<Message | null> => {
    try {
        const response = await fetch(`/api/messages?chatId=${chatId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content, senderId }),
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        const data = await response.json();
        const msg = data.message;
        return {
            id: msg.id,
            content: msg.content,
            senderId: msg.sender_id,
            timestamp: new Date(msg.created_at).getTime(),
            type: 'text',
        };
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
};
