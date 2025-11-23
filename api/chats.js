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

        // ✅ 优化1：单次查询获取所有聊天ID和最后消息
        const { rows: chatRows } = await client.query(`
      SELECT 
        m1.chat_id,
        m1.content as last_message,
        m1.sender_id,
        m1.created_at as last_time
      FROM messages m1
      INNER JOIN (
        SELECT chat_id, MAX(created_at) as max_time
        FROM messages
        WHERE chat_id LIKE 'chat_%'
          AND (chat_id LIKE '%_' || $1 || '_%' 
               OR chat_id LIKE 'chat_' || $1 || '_%'
               OR chat_id LIKE '%_' || $1)
        GROUP BY chat_id
      ) m2 ON m1.chat_id = m2.chat_id AND m1.created_at = m2.max_time
      ORDER BY m1.created_at DESC
    `, [currentUserId]);

        console.log(`[/api/chats] Found ${chatRows.length} chats`);

        if (chatRows.length === 0) {
            return res.status(200).json({ chats: [] });
        }

        // 提取所有partner IDs
        const partnerIds = [];
        const chatInfoMap = new Map();

        for (const row of chatRows) {
            const chatId = row.chat_id;

            if (!chatId.startsWith('chat_')) continue;

            let partnerId = null;
            if (chatId.startsWith(`chat_${currentUserId}_`)) {
                partnerId = chatId.substring(`chat_${currentUserId}_`.length);
            } else if (chatId.endsWith(`_${currentUserId}`)) {
                partnerId = chatId.substring(5, chatId.length - currentUserId.length - 1);
            }

            if (!partnerId) continue;

            partnerIds.push(partnerId);
            chatInfoMap.set(chatId, {
                partnerId,
                lastMessage: row.last_message,
                lastMessageTime: new Date(row.last_time).getTime(),
            });
        }

        console.log(`[/api/chats] Extracted ${partnerIds.length} partner IDs`);

        // ✅ 优化2：批量查询所有partner信息
        const { rows: partnerRows } = await client.query(
            'SELECT user_id, username, display_name, avatar_url FROM users WHERE user_id = ANY($1)',
            [partnerIds]
        );

        const partnerMap = new Map();
        partnerRows.forEach(p => {
            partnerMap.set(p.user_id, {
                userId: p.user_id,
                displayName: p.display_name,
                avatar: p.avatar_url
            });
        });

        console.log(`[/api/chats] Loaded ${partnerMap.size} partner details`);

        // ✅ 优化3：批量查询所有聊天的未读数
        const chatIds = Array.from(chatInfoMap.keys());

        const { rows: unreadRows } = await client.query(`
      SELECT 
        m.chat_id,
        COUNT(*) as unread_count
      FROM messages m
      LEFT JOIN chat_read_status rs ON m.chat_id = rs.chat_id AND rs.user_id = $1
      WHERE m.chat_id = ANY($2)
        AND m.sender_id != $1
        AND m.created_at > COALESCE(rs.last_read_at, '1970-01-01'::timestamp)
      GROUP BY m.chat_id
    `, [currentUserId, chatIds]);

        const unreadMap = new Map();
        unreadRows.forEach(row => {
            unreadMap.set(row.chat_id, parseInt(row.unread_count));
        });

        console.log(`[/api/chats] Calculated unread counts for ${unreadMap.size} chats`);

        // 组装最终结果
        const chats = [];
        for (const [chatId, info] of chatInfoMap.entries()) {
            const partner = partnerMap.get(info.partnerId);

            if (!partner) {
                console.warn(`[/api/chats] Partner not found: ${info.partnerId}`);
                continue;
            }

            chats.push({
                id: chatId,
                partnerId: partner.userId,
                partnerName: partner.displayName,
                partnerAvatar: partner.avatar,
                lastMessage: info.lastMessage,
                lastMessageTime: info.lastMessageTime,
                unreadCount: unreadMap.get(chatId) || 0,
            });
        }

        console.log(`[/api/chats] ✅ OPTIMIZED: Returning ${chats.length} chats using only 3 queries!`);
        console.log(`========== End of /api/chats ==========\n`);

        res.status(200).json({ chats });

    } catch (error) {
        console.error('[/api/chats] ERROR:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    } finally {
        client.release();
    }
}
