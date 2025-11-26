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

    const { momentId, content } = req.body;
    if (!momentId || !content) {
        return res.status(400).json({ error: 'Moment ID and content are required' });
    }

    const client = await pool.connect();
    try {
        // 获取当前评论列表
        const { rows } = await client.query(
            'SELECT comments FROM moments WHERE id = $1',
            [momentId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Moment not found' });
        }

        let comments = rows[0].comments || [];

        // 获取用户信息以便存储显示名
        const { rows: userRows } = await client.query(
            'SELECT display_name FROM users WHERE user_id = $1',
            [currentUserId]
        );
        const displayName = userRows[0]?.display_name || 'User';

        const newComment = {
            id: Date.now().toString(),
            userId: currentUserId,
            displayName,
            content,
            createdAt: new Date().toISOString()
        };

        comments.push(newComment);

        // 更新数据库
        await client.query(
            'UPDATE moments SET comments = $1 WHERE id = $2',
            [JSON.stringify(comments), momentId]
        );

        res.status(200).json({ success: true, comments });
    } catch (error) {
        console.error('[/api/moments/comment] Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
