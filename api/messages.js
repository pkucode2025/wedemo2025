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
    const { chatId } = req.query;
    console.log(`[/api/messages] ${req.method} request for chatId: ${chatId}`);

    if (!chatId) {
        console.log('[/api/messages] Missing chatId');
        return res.status(400).json({ error: 'Chat ID is required' });
    }

    const client = await pool.connect();
    try {
        if (req.method === 'GET') {
            console.log('[/api/messages] Fetching messages...');
            const { rows } = await client.query(
                'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
                [chatId]
            );
            console.log(`[/api/messages] Found ${rows.length} messages`);
            return res.status(200).json({ messages: rows });
        }

        if (req.method === 'POST') {
            const { content, senderId } = req.body;
            console.log(`[/api/messages] Inserting message from ${senderId}`);

            if (!content || !senderId) {
                console.log('[/api/messages] Missing required fields');
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const { rows } = await client.query(
                'INSERT INTO messages (content, sender_id, chat_id) VALUES ($1, $2, $3) RETURNING *',
                [content, senderId, chatId]
            );
            console.log(`[/api/messages] Message inserted:`, rows[0]);
            return res.status(200).json({ message: rows[0] });
        }

        console.log(`[/api/messages] Method ${req.method} not allowed`);
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('[/api/messages] Error:', error);
        return res.status(500).json({
            error: error.message,
            code: error.code
        });
    } finally {
        client.release();
        console.log('[/api/messages] Client released');
    }
}
