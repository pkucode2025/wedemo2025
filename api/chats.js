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
        console.error('[/api/chats] No authorization header');
        return res.status(401).json({ error: '未授权' });
    }

    const token = authHeader.substring(7);
    const currentUserId = validateToken(token);

    if (!currentUserId) {
        console.error('[/api/chats] Invalid token');
        return res.status(401).json({ error: '无效token' });
    }

    const client = await pool.connect();
    try {
        console.log(`\n========== [/api/chats] Getting chats for user: ${currentUserId} ==========`);

        // 获取当前用户参与的所有聊天的chat_id
        const { rows: chatRows } = await client.query(`
      SELECT DISTINCT chat_id, MAX(created_at) as last_time
      FROM messages
      WHERE chat_id LIKE 'chat_%'
        AND (chat_id LIKE '%_' || $1 || '_%' 
             OR chat_id LIKE 'chat_' || $1 || '_%'
             OR chat_id LIKE '%_' || $1)
      GROUP BY chat_id
      ORDER BY MAX(created_at) DESC
    `, [currentUserId]);

        console.log(`[/api/chats] Found ${chatRows.length} chat IDs for user ${currentUserId}`);
        chatRows.forEach(row => console.log(`  - ${row.chat_id}`));

        const chats = [];

        for (const chatRow of chatRows) {
            const chatId = chatRow.chat_id;
            console.log(`\n[/api/chats] Processing chatId: ${chatId}`);

            // 从chat_id提取对方的userId（格式：chat_user1_user2）
            if (!chatId.startsWith('chat_')) {
                console.log(`  ❌ Skipping: doesn't start with 'chat_'`);
                continue;
            }

            // 移除 "chat_" 前缀
            const userPart = chatId.substring(5); // 去掉 "chat_"
            const parts = userPart.split('_');

            console.log(`  Parts after removing 'chat_':`, parts);

            if (parts.length < 2) {
                console.log(`  ❌ Skipping: not enough parts`);
                continue;
            }

            // 重新组合完整的userId（可能包含下划线）
            // 例如：chat_u_123_u_456 -> parts = ['u', '123', 'u', '456']
            // 需要找到分界点

            // 简化方法：直接用字符串操作
            let partnerId = null;

            // 尝试两种可能：
            // 1. currentUserId在前
            if (chatId.startsWith(`chat_${currentUserId}_`)) {
                partnerId = chatId.substring(`chat_${currentUserId}_`.length);
                console.log(`  ✓ Current user is first, partner:`, partnerId);
            }
            // 2. currentUserId在后
            else if (chatId.endsWith(`_${currentUserId}`)) {
                partnerId = chatId.substring(5, chatId.length - currentUserId.length - 1); // 5 = 'chat_'.length
                console.log(`  ✓ Current user is second, partner:`, partnerId);
            }

            if (!partnerId) {
                console.log(`  ❌ Skipping: couldn't extract partnerId`);
                continue;
            }

            console.log(`  Partner ID: ${partnerId}`);

            // 获取最后一条消息
            const { rows: lastMsgRows } = await client.query(
                'SELECT content, sender_id, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 1',
                [chatId]
            );

            if (lastMsgRows.length === 0) {
                console.log(`  ❌ Skipping: no messages found`);
                continue;
            }

            const lastMessage = lastMsgRows[0];
            console.log(`  Last message: "${lastMessage.content.substring(0, 20)}..."`);

            // 获取对方用户信息
            const { rows: partnerRows } = await client.query(
                'SELECT user_id, username, display_name, avatar_url FROM users WHERE user_id = $1',
                [partnerId]
            );

            if (partnerRows.length === 0) {
                console.warn(`  ❌ Partner not found in database: ${partnerId}`);
                continue;
            }

            const partner = partnerRows[0];
            console.log(`  Partner name: ${partner.display_name}`);

            // 计算未读数
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
            console.log(`  Unread count: ${unreadCount}`);

            chats.push({
                id: chatId,
                partnerId: partner.user_id,
                partnerName: partner.display_name,
                partnerAvatar: partner.avatar_url,
                lastMessage: lastMessage.content,
                lastMessageTime: new Date(lastMessage.created_at).getTime(),
                unreadCount,
            });

            console.log(`  ✅ Added chat to list`);
        }

        // 按最后消息时间排序
        chats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

        console.log(`\n[/api/chats] FINAL RESULT: Returning ${chats.length} chats`);
        chats.forEach((chat, i) => {
            console.log(`  ${i + 1}. ${chat.partnerName} - "${chat.lastMessage.substring(0, 20)}..." (unread: ${chat.unreadCount})`);
        });
        console.log(`========== End of /api/chats ==========\n`);

        res.status(200).json({ chats });

    } catch (error) {
        console.error('[/api/chats] ERROR:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    } finally {
        client.release();
    }
}
