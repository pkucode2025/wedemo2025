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

    const { momentId } = req.body;
    if (!momentId) {
        return res.status(400).json({ error: 'Moment ID is required' });
    }

    const client = await pool.connect();
    try {
        // 获取当前点赞列表
        const { rows } = await client.query(
            'SELECT likes FROM moments WHERE id = $1',
            [momentId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Moment not found' });
        }

        let likes = rows[0].likes || [];
        const hasLiked = likes.includes(currentUserId);

        if (hasLiked) {
            // 取消点赞
            likes = likes.filter(id => id !== currentUserId);
        } else {
            // 点赞
            likes.push(currentUserId);
        }

        // 更新数据库
        await client.query(
            'UPDATE moments SET likes = $1 WHERE id = $2',
            [JSON.stringify(likes), momentId]
        );

        res.status(200).json({ success: true, likes, hasLiked: !hasLiked });
    } catch (error) {
        console.error('[/api/moments/like] Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
