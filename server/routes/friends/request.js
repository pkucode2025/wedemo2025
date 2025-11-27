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

    const { toUserId, message } = req.body;
    if (!toUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
    }

    if (toUserId === currentUserId) {
        return res.status(400).json({ error: 'Cannot add yourself' });
    }

    const client = await pool.connect();
    try {
        // Check if already friends
        const { rows: existingFriend } = await client.query(
            'SELECT * FROM friendships WHERE user_id = $1 AND friend_id = $2',
            [currentUserId, toUserId]
        );

        if (existingFriend.length > 0) {
            return res.status(400).json({ error: 'Already friends' });
        }

        // Upsert request
        await client.query(`
      INSERT INTO friend_requests (from_user_id, to_user_id, message, status)
      VALUES ($1, $2, $3, 'pending')
      ON CONFLICT (from_user_id, to_user_id)
      DO UPDATE SET status = 'pending', message = $3, created_at = NOW()
    `, [currentUserId, toUserId, message || '我是' + currentUserId]);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('[/api/friends/request] Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
