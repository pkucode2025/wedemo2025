import { createClient } from '@vercel/postgres';
import { createClient } from '@vercel/postgres';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(request: any, response: any) {
    console.log("Setup function started");
    const client = createClient();
    try {
        await client.connect();
        console.log("Connected to database");

        const result = await client.sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        console.log("Table created/verified");

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ result }));
    } catch (error: any) {
        console.error("Setup error:", error);
        response.statusCode = 500;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ error: error.message }));
    } finally {
        await client.end();
    }
}
