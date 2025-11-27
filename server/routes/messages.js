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
    const client = await pool.connect();

    try {
        if (req.method === 'GET') {
            const { chatId } = req.query;

            if (!chatId) {
                return res.status(400).json({ error: 'Missing chatId' });
            }

            console.log(`[/api/messages] GET request for chatId: ${chatId}`);

            const { rows } = await client.query(
                `SELECT m.*, u.display_name as sender_name, u.avatar_url as sender_avatar 
                 FROM messages m 
                 LEFT JOIN users u ON m.sender_id = u.user_id 
                 WHERE m.chat_id = $1 
                 ORDER BY m.created_at ASC`,
                [chatId]
            );

            const messages = rows.map(row => ({
                id: row.id.toString(),
                senderId: row.sender_id,
                senderName: row.sender_name || row.sender_id,
                senderAvatar: row.sender_avatar || 'https://picsum.photos/id/64/200/200',
                content: row.content,
                timestamp: new Date(row.created_at).getTime(),
                type: row.type || 'text'
            }));

            console.log(`[/api/messages] Returning ${messages.length} messages`);
            res.status(200).json({ messages });

        } else if (req.method === 'POST') {
            // 验证token
            const authHeader = req.headers.authorization;
            let currentUserId = null;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                currentUserId = validateToken(token);
            }

            const { chatId, content, senderId, type = 'text' } = req.body;

            if (!chatId || !content || !senderId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // 如果有token，验证senderId是否匹配
            if (currentUserId && senderId !== currentUserId) {
                console.warn(`[/api/messages] Token userId ${currentUserId} doesn't match senderId ${senderId}`);
            }

            console.log(`[/api/messages] POST request - chatId: ${chatId}, senderId: ${senderId}, type: ${type}`);

            const { rows } = await client.query(
                'INSERT INTO messages (content, sender_id, chat_id, type, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
                [content, senderId, chatId, type]
            );

            const message = {
                id: rows[0].id.toString(),
                senderId: rows[0].sender_id,
                content: rows[0].content,
                timestamp: new Date(rows[0].created_at).getTime(),
                type: rows[0].type
            };

            console.log(`[/api/messages] Message saved successfully`);
            res.status(200).json({ message });

        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('[/api/messages] Error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    } finally {
        client.release();
    }
}
