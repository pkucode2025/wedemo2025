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
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    const client = await pool.connect();
    try {
        const { rows } = await client.query(
            'SELECT user_id, username, display_name, avatar_url FROM users WHERE user_id = $1',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = rows[0];

        res.status(200).json({
            success: true,
            user: {
                userId: user.user_id,
                username: user.username,
                displayName: user.display_name,
                avatar: user.avatar_url
            }
        });
    } catch (error) {
        console.error('[/api/users/[userId]] Error:', error);
        res.status(500).json({ error: '获取用户信息失败' });
    } finally {
        client.release();
    }
}
