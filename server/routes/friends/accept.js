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

    const { requestId, fromUserId } = req.body;
    if (!requestId || !fromUserId) {
        return res.status(400).json({ error: 'Request ID and From User ID are required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Update request status
        await client.query(
            'UPDATE friend_requests SET status = \'accepted\' WHERE id = $1 AND to_user_id = $2',
            [requestId, currentUserId]
        );

        // 2. Create friendship (bidirectional)
        await client.query(
            'INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [currentUserId, fromUserId]
        );
        await client.query(
            'INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [fromUserId, currentUserId]
        );

        // 3. Create initial chat session (optional, but good for UX)
        const [u1, u2] = [currentUserId, fromUserId].sort();
        const chatId = `chat_${u1}_${u2}`;

        await client.query(
            'INSERT INTO messages (chat_id, sender_id, content) VALUES ($1, $2, $3)',
            [chatId, 'system', '我们已经是好友了，开始聊天吧！']
        );

        await client.query('COMMIT');
        res.status(200).json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[/api/friends/accept] Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
