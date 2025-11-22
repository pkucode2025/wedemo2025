import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    try {
        const result = await sql`
      CREATE TABLE IF NOT EXISTS messages(
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
        const envKeys = Object.keys(process.env).filter(key => key.toUpperCase().includes('POSTGRES') || key.toUpperCase().includes('DATABASE'));
        return new Response(JSON.stringify({
            error: error.message,
            code: error.code,
            availableEnvVars: envKeys,
            hint: "If POSTGRES_URL is missing, the SDK cannot connect automatically."
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
