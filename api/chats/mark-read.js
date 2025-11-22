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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 验证用户身份
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权' });
    }

    const token = authHeader.substring(7);
    const currentUserId = validateToken(token);

    if (!currentUserId) {
        return res.status(401).json({ error: '无效token' });
    }

    const { chatId } = req.body;

    if (!chatId) {
        return res.status(400).json({ error: '缺少chatId' });
    }

    const client = await pool.connect();
    try {
        console.log(`[/api/chats/mark-read] Marking chat ${chatId} as read for user ${currentUserId}`);

        // 更新或插入已读状态
        await client.query(`
      INSERT INTO chat_read_status (chat_id, user_id, last_read_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (chat_id, user_id)
      DO UPDATE SET last_read_at = NOW()
    `, [chatId, currentUserId]);

        console.log(`[/api/chats/mark-read] Successfully marked as read`);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('[/api/chats/mark-read] Error:', error);
        res.status(500).json({ error: '操作失败' });
    } finally {
        client.release();
    }
}
