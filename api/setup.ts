import { createClient } from '@vercel/postgres';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(request: Request) {
    const client = createClient();
    await client.connect();

    try {
        const result = await client.sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        return new Response(JSON.stringify({ result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } finally {
        await client.end();
    }
}
