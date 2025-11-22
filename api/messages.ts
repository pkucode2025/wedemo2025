import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    const url = new URL(request.url);
    const chatId = url.searchParams.get('chatId');

    if (!chatId) {
        return new Response(JSON.stringify({ error: 'Chat ID is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (request.method === 'GET') {
        try {
            const { rows } = await sql`
        SELECT * FROM messages 
        WHERE chat_id = ${chatId} 
        ORDER BY created_at ASC;
      `;
            return new Response(JSON.stringify({ messages: rows }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            return new Response(JSON.stringify({ error }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    } else if (request.method === 'POST') {
        try {
            const { content, senderId } = await request.json();
            if (!content || !senderId) {
                return new Response(JSON.stringify({ error: 'Missing content or senderId' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            const { rows } = await sql`
        INSERT INTO messages (content, sender_id, chat_id)
        VALUES (${content}, ${senderId}, ${chatId})
        RETURNING *;
      `;

            return new Response(JSON.stringify({ message: rows[0] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            return new Response(JSON.stringify({ error }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
    });
}
