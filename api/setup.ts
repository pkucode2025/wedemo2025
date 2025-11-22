import { createClient } from '@vercel/postgres';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(request: any, response: any) {
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
        return response.status(200).json({ result });
    } catch (error: any) {
        return response.status(500).json({ error: error.message });
    } finally {
        await client.end();
    }
}
