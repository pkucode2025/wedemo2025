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

    const { messageId } = req.body;
    if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' });
    }

    const client = await pool.connect();
    try {
        // Check message ownership and time limit (2 minutes)
        const { rows } = await client.query(
            'SELECT * FROM messages WHERE id = $1',
            [messageId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const message = rows[0];
        if (message.sender_id !== currentUserId) {
            return res.status(403).json({ error: 'Cannot recall others\' messages' });
        }

        const createdTime = new Date(message.created_at).getTime();
        const now = Date.now();
        if (now - createdTime > 2 * 60 * 1000) {
            return res.status(400).json({ error: 'Time limit exceeded (2 minutes)' });
        }

        // Mark as recalled
        await client.query(
            'UPDATE messages SET is_recalled = TRUE WHERE id = $1',
            [messageId]
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('[/api/messages/recall] Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
