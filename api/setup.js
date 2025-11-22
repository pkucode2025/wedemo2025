import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
    console.error('Pool error:', err);
});

export default async function handler(req, res) {
    console.log('[/api/setup] Request received');

    const client = await pool.connect();
    try {
        console.log('[/api/setup] Creating table...');
        const result = await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('[/api/setup] Table created successfully');
        res.status(200).json({ message: "Database initialized successfully", result });
    } catch (error) {
        console.error('[/api/setup] Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
