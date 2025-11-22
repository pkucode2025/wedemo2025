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

    const client = await pool.connect();
    try {
        console.log(`[/api/chats] Getting chats for user: ${currentUserId}`);

        // 获取用户参与的所有聊天
        const { rows: chatRows } = await client.query(`
      SELECT DISTINCT chat_id
      FROM messages
      WHERE chat_id LIKE '%' || $1 || '%'
      ORDER BY chat_id
    `, [currentUserId]);

        console.log(`[/api/chats] Found ${chatRows.length} chat IDs`);

        const chats = [];

        for (const chatRow of chatRows) {
            const chatId = chatRow.chat_id;

            // 从chat_id提取对方的userId（格式：chat_user1_user2）
            if (!chatId.startsWith('chat_')) continue;

            const parts = chatId.split('_');
            if (parts.length !== 3) continue;

            const user1 = parts[1];
            const user2 = parts[2];

            // 确定对方是谁
            const partnerId = user1 === currentUserId ? user2 : user1;

            // 获取最后一条消息
            const { rows: lastMsgRows } = await client.query(
                'SELECT content, sender_id, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 1',
                [chatId]
            );

            if (lastMsgRows.length === 0) continue;

            const lastMessage = lastMsgRows[0];

            // 获取对方用户信息
            const { rows: partnerRows } = await client.query(
                'SELECT user_id, username, display_name, avatar_url FROM users WHERE user_id = $1',
                [partnerId]
            );

            if (partnerRows.length === 0) {
                console.warn(`[/api/chats] Partner not found: ${partnerId}`);
                continue;
            }

            const partner = partnerRows[0];

            // 计算未读数（对方发送的、当前用户未读的消息）
            const { rows: unreadRows } = await client.query(
                `SELECT COUNT(*) as count 
         FROM messages 
         WHERE chat_id = $1 
         AND sender_id = $2 
         AND created_at > COALESCE(
           (SELECT last_read_at FROM chat_read_status WHERE chat_id = $1 AND user_id = $3),
           '1970-01-01'::timestamp
         )`,
                [chatId, partnerId, currentUserId]
            );

            const unreadCount = parseInt(unreadRows[0].count) || 0;

            chats.push({
                id: chatId,
                partnerId: partner.user_id,
                partnerName: partner.display_name,
                partnerAvatar: partner.avatar_url,
                lastMessage: lastMessage.content,
                lastMessageTime: new Date(lastMessage.created_at).getTime(),
                unreadCount,
            });
        }

        // 按最后消息时间排序
        chats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

        console.log(`[/api/chats] Returning ${chats.length} chats with unread counts`);
        res.status(200).json({ chats });

    } catch (error) {
        console.error('[/api/chats] Error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    } finally {
        client.release();
    }
}
