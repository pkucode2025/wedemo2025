import { createClient } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
    const { chatId } = request.query;

    if (!chatId || Array.isArray(chatId)) {
        return response.status(400).json({ error: 'Chat ID is required and must be a single string' });
    }

    const client = createClient();
    await client.connect();

    try {
        if (request.method === 'GET') {
            const { rows } = await client.sql`
        SELECT * FROM messages 
        WHERE chat_id = ${chatId} 
        ORDER BY created_at ASC;
      `;
            return response.status(200).json({ messages: rows });
        } else if (request.method === 'POST') {
            const { content, senderId } = request.body;
            if (!content || !senderId) {
                return response.status(400).json({ error: 'Missing content or senderId' });
            }

            const { rows } = await client.sql`
        INSERT INTO messages (content, sender_id, chat_id)
        VALUES (${content}, ${senderId}, ${chatId})
        RETURNING *;
      `;

            return response.status(200).json({ message: rows[0] });
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        return response.status(500).json({ error: error.message });
    } finally {
        await client.end();
    }
}
