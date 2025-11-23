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

// Decode and validate token
function validateToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId, timestamp] = decoded.split(':');

        // Token expires after 30 days
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
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权' });
    }

    const token = authHeader.substring(7);
    const userId = validateToken(token);

    if (!userId) {
        return res.status(401).json({ error: '无效或过期的token' });
    }

    const client = await pool.connect();
    try {
        const { rows } = await client.query(
            'SELECT user_id, username, display_name, avatar_url, bio, created_at FROM users WHERE user_id = $1',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }

        const user = rows[0];

        res.status(200).json({
            success: true,
            user: {
                userId: user.user_id,
                username: user.username,
                displayName: user.display_name,
                avatar: user.avatar_url,
                bio: user.bio,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('[/api/auth/me] Error:', error);
        res.status(500).json({ error: '获取用户信息失败' });
    } finally {
        client.release();
    }
}
