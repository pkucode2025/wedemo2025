import { Message } from '../types';

export const fetchMessages = async (chatId: string): Promise<Message[]> => {
    console.log(`[API] Fetching messages for chatId: ${chatId}`);
    try {
        const url = `/api/messages?chatId=${chatId}`;
        console.log(`[API] Request URL: ${url}`);

        const response = await fetch(url);
        console.log(`[API] Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API] Fetch failed:`, errorText);
            throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        console.log(`[API] Received data:`, data);
        console.log(`[API] Number of messages: ${data.messages?.length || 0}`);

        const messages = data.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.sender_id,
            timestamp: new Date(msg.created_at).getTime(),
            type: 'text',
        }));

        console.log(`[API] Mapped messages:`, messages);
        return messages;
    } catch (error) {
        console.error('[API] Error fetching messages:', error);
        return [];
    }
};

export const sendMessageToBackend = async (chatId: string, content: string, senderId: string): Promise<Message | null> => {
    console.log(`[API] Sending message to chatId: ${chatId}, senderId: ${senderId}, content: "${content}"`);
    try {
        const url = `/api/messages?chatId=${chatId}`;
        const payload = { content, senderId };
        console.log(`[API] POST URL: ${url}`);
        console.log(`[API] Payload:`, payload);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        console.log(`[API] Send response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API] Send failed:`, errorText);
            throw new Error('Failed to send message');
        }

        const data = await response.json();
        console.log(`[API] Send response data:`, data);

        const msg = data.message;
        const mappedMessage: Message = {
            id: msg.id,
            content: msg.content,
            senderId: msg.sender_id,
            timestamp: new Date(msg.created_at).getTime(),
            type: 'text' as const,
        };

        console.log(`[API] Mapped sent message:`, mappedMessage);
        return mappedMessage;
    } catch (error) {
        console.error('[API] Error sending message:', error);
        return null;
    }
};
