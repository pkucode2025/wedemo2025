import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权' });
    }

    const token = authHeader.substring(7);
    const currentUserId = validateToken(token);

    if (!currentUserId) {
        return res.status(401).json({ error: '无效token' });
    }

    const client = await pool.connect();
    try {
        if (req.method === 'GET') {
            // 获取朋友圈列表（自己和朋友的）
            // 1. 获取好友列表
            const { rows: friends } = await client.query(
                'SELECT friend_id FROM friendships WHERE user_id = $1',
                [currentUserId]
            );

            const friendIds = friends.map(f => f.friend_id);
            // 加上自己
            const targetIds = [...friendIds, currentUserId];

            // 2. 查询朋友圈
            const { rows: moments } = await client.query(`
        SELECT m.*, u.display_name, u.avatar_url
        FROM moments m
        JOIN users u ON m.user_id = u.user_id
        WHERE m.user_id = ANY($1)
        ORDER BY m.created_at DESC
        LIMIT 50
      `, [targetIds]);

            res.status(200).json({ moments });

        } else if (req.method === 'POST') {
            // 发布朋友圈
            const { content } = req.body;

            if (!content) {
                return res.status(400).json({ error: '内容不能为空' });
            }

            const { rows } = await client.query(
                'INSERT INTO moments (user_id, content) VALUES ($1, $2) RETURNING *',
                [currentUserId, content]
            );

            res.status(201).json({ moment: rows[0] });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('[/api/moments] Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
