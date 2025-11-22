import { createClient } from '@vercel/postgres';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(request: any, response: any) {
    const { chatId } = request.query;

    if (!chatId || Array.isArray(chatId)) {
        response.statusCode = 400;
        response.setHeader('Content-Type', 'application/json');
        return response.end(JSON.stringify({ error: 'Chat ID is required and must be a single string' }));
    }

    const client = createClient();
    try {
        await client.connect();

        if (request.method === 'GET') {
            const { rows } = await client.sql`
        SELECT * FROM messages 
        WHERE chat_id = ${chatId} 
        ORDER BY created_at ASC;
      `;
            response.statusCode = 200;
            response.setHeader('Content-Type', 'application/json');
            return response.end(JSON.stringify({ messages: rows }));
        } else if (request.method === 'POST') {
            const { content, senderId } = request.body;
            if (!content || !senderId) {
                response.statusCode = 400;
                response.setHeader('Content-Type', 'application/json');
                return response.end(JSON.stringify({ error: 'Missing content or senderId' }));
            }

            const { rows } = await client.sql`
        INSERT INTO messages (content, sender_id, chat_id)
        VALUES (${content}, ${senderId}, ${chatId})
        RETURNING *;
      `;

            response.statusCode = 200;
            response.setHeader('Content-Type', 'application/json');
            return response.end(JSON.stringify({ message: rows[0] }));
        }

        response.statusCode = 405;
        response.setHeader('Content-Type', 'application/json');
        return response.end(JSON.stringify({ error: 'Method not allowed' }));
    } catch (error: any) {
        console.error("Messages API error:", error);
        response.statusCode = 500;
        response.setHeader('Content-Type', 'application/json');
        return response.end(JSON.stringify({ error: error.message }));
    } finally {
        await client.end();
    }
}
