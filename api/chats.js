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

// User information mapping
const USERS = {
    'alice': { id: 'alice', name: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
    'bob': { id: 'bob', name: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
    'carol': { id: 'carol', name: 'Carol', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol' },
    'gemini': { id: 'gemini', name: 'Gemini AI', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gemini', isAi: true },
    'me': { id: 'me', name: 'Me', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me' }
};

export default async function handler(req, res) {
    console.log(`[/api/chats] ${req.method} request`);

    const client = await pool.connect();
    try {
        // Get all chat IDs and their latest message info
        const { rows: chatRows } = await client.query(`
      SELECT 
        chat_id,
        MAX(created_at) as last_message_time,
        COUNT(*) as message_count
      FROM messages 
      GROUP BY chat_id
      ORDER BY MAX(created_at) DESC
    `);

        // For each chat, get the last message and partner info
        const chats = await Promise.all(chatRows.map(async (chat) => {
            const { rows: lastMsgRows } = await client.query(
                'SELECT content, sender_id, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 1',
                [chat.chat_id]
            );

            const lastMessage = lastMsgRows[0];
            const partnerId = chat.chat_id.replace('c_', ''); // Extract partner ID from chat ID
            const partner = USERS[partnerId] || { id: partnerId, name: partnerId, avatar: '' };

            // Get unread count (messages from partner that are newer than the last time we opened this chat)
            // For now, we'll set unread to 0 when chat is opened, so all messages from partner are unread
            const { rows: unreadRows } = await client.query(
                'SELECT COUNT(*) as count FROM messages WHERE chat_id = $1 AND sender_id = $2',
                [chat.chat_id, partnerId]
            );

            return {
                id: chat.chat_id,
                partnerId: partner.id,
                partnerName: partner.name,
                partnerAvatar: partner.avatar,
                isAi: partner.isAi || false,
                lastMessage: lastMessage.content,
                lastMessageTime: new Date(lastMessage.created_at).getTime(),
                unreadCount: 0, // We'll manage this on the frontend for now
                messageCount: parseInt(chat.message_count)
            };
        }));

        console.log(`[/api/chats] Returning ${chats.length} chats`);
        res.status(200).json({ chats });
    } catch (error) {
        console.error('[/api/chats] Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
