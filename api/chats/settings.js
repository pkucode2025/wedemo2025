import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

function validateToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId, timestamp] = decoded.split(':');
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(timestamp) > thirtyDays) {
            return null;
        }
        return userId;
    } catch (error) {
        return null;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权' });
    }

    const token = authHeader.substring(7);
    const currentUserId = validateToken(token);

    if (!currentUserId) {
        return res.status(401).json({ error: '无效token' });
    }

    const { chatId, setting, value } = req.body;
    if (!chatId || !setting) {
        return res.status(400).json({ error: 'Chat ID and setting are required' });
    }

    // Valid settings: 'is_muted', 'is_sticky'
    if (!['is_muted', 'is_sticky'].includes(setting)) {
        return res.status(400).json({ error: 'Invalid setting' });
    }

    const client = await pool.connect();
    try {
        // Check if record exists in chat_read_status (we can reuse this table or create a new one)
        // Let's create/use a 'chat_settings' table or add columns to 'chat_read_status'
        // For simplicity, let's assume we add columns to 'chat_read_status' or create a new table.
        // Let's create a new table 'chat_settings' if not exists.

        await client.query(`
      CREATE TABLE IF NOT EXISTS chat_settings (
        id SERIAL PRIMARY KEY,
        chat_id TEXT NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        is_muted BOOLEAN DEFAULT FALSE,
        is_sticky BOOLEAN DEFAULT FALSE,
        UNIQUE(chat_id, user_id)
      );
    `);

        // Upsert setting
        const query = `
      INSERT INTO chat_settings (chat_id, user_id, ${setting})
      VALUES ($1, $2, $3)
      ON CONFLICT (chat_id, user_id)
      DO UPDATE SET ${setting} = $3
      RETURNING *;
    `;

        const { rows } = await client.query(query, [chatId, currentUserId, value]);

        res.status(200).json({ success: true, settings: rows[0] });
    } catch (error) {
        console.error('[/api/chats/settings] Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
