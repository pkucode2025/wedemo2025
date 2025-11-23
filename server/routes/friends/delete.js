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

    const { friendId } = req.body;
    if (!friendId) {
        return res.status(400).json({ error: 'Friend ID is required' });
    }

    const client = await pool.connect();
    try {
        // 删除好友关系（双向删除）
        await client.query(
            'DELETE FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
            [currentUserId, friendId]
        );

        // 可选：同时也删除相关的聊天记录？微信删除好友后，聊天记录通常会被隐藏或删除。
        // 我们这里生成chatId并删除消息
        const [u1, u2] = [currentUserId, friendId].sort();
        const chatId = `chat_${u1}_${u2}`;

        await client.query(
            'DELETE FROM messages WHERE chat_id = $1',
            [chatId]
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('[/api/friends/delete] Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
