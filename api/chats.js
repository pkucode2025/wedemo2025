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
        // 获取用户的所有聊天会话
        // 查找所有包含当前用户的聊天
        const { rows: chatRows } = await client.query(`
      SELECT DISTINCT
        CASE 
          WHEN chat_id LIKE 'c_%' THEN chat_id
          ELSE NULL
        END as chat_id,
        MAX(created_at) as last_message_time
      FROM messages
      WHERE sender_id = $1 OR chat_id LIKE '%' || $1 || '%'
      GROUP BY chat_id
      HAVING chat_id IS NOT NULL
      ORDER BY MAX(created_at) DESC
    `, [currentUserId]);

        const chats = await Promise.all(chatRows.map(async (chat) => {
            // 获取最后一条消息
            const { rows: lastMsgRows } = await client.query(
                'SELECT content, sender_id, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 1',
                [chat.chat_id]
            );

            if (lastMsgRows.length === 0) return null;

            const lastMessage = lastMsgRows[0];

            // 提取对方ID（chat_id格式：c_userId）
            const partnerId = chat.chat_id.replace('c_', '');

            // 如果partnerId就是当前用户，跳过（避免自己给自己发消息的情况）
            if (partnerId === currentUserId) return null;

            // 获取对方信息
            const { rows: partnerRows } = await client.query(
                'SELECT user_id, username, display_name, avatar_url FROM users WHERE user_id = $1',
                [partnerId]
            );

            if (partnerRows.length === 0) return null;

            const partner = partnerRows[0];

            // 计算未读数（对方发送的，在最后阅读时间之后的消息）
            // 简化处理：暂时设为0，后续可以实现已读机制
            const unreadCount = 0;

            return {
                id: chat.chat_id,
                partnerId: partner.user_id,
                partnerName: partner.display_name,
                partnerAvatar: partner.avatar_url,
                lastMessage: lastMessage.content,
                lastMessageTime: new Date(lastMessage.created_at).getTime(),
                unreadCount,
                messageCount: 0
            };
        }));

        // 过滤掉null值
        const validChats = chats.filter(c => c !== null);

        console.log(`[/api/chats] Returning ${validChats.length} chats for user ${currentUserId}`);
        res.status(200).json({ chats: validChats });

    } catch (error) {
        console.error('[/api/chats] Error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    } finally {
        client.release();
    }
}
