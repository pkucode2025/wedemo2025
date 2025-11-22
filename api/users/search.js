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

// 验证token
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
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { q } = req.query;

    if (!q || q.length < 2) {
        return res.status(400).json({ error: '搜索关键词至少需要2个字符' });
    }

    const client = await pool.connect();
    try {
        // 搜索用户名或显示名称
        const { rows } = await client.query(
            `SELECT user_id, username, display_name, avatar_url 
       FROM users 
       WHERE username ILIKE $1 OR display_name ILIKE $1
       LIMIT 20`,
            [`%${q}%`]
        );

        const users = rows.map(user => ({
            userId: user.user_id,
            username: user.username,
            displayName: user.display_name,
            avatar: user.avatar_url
        }));

        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error('[/api/users/search] Error:', error);
        res.status(500).json({ error: '搜索失败' });
    } finally {
        client.release();
    }
}
