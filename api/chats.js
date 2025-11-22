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

// User information mapping - MUST match constants.ts in frontend
const USERS = {
    'alice': { id: 'alice', name: 'Alice Chen', avatar: 'https://picsum.photos/id/65/200/200' },
    'bob': { id: 'bob', name: 'Bob Zhang', avatar: 'https://picsum.photos/id/91/200/200' },
    'carol': { id: 'carol', name: 'Carol Liu', avatar: 'https://picsum.photos/id/103/200/200' },
    'david': { id: 'david', name: 'David Wang', avatar: 'https://picsum.photos/id/177/200/200' },
    'gemini': { id: 'gemini', name: 'WeChat AI', avatar: 'https://picsum.photos/id/2/200/200', isAi: true },
    'me': { id: 'me', name: 'Developer', avatar: 'https://picsum.photos/id/64/200/200' }
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

        console.log(`[/api/chats] Found ${chatRows.length} chats in database`);

        // For each chat, get the last message and partner info
        const chats = await Promise.all(chatRows.map(async (chat) => {
            const { rows: lastMsgRows } = await client.query(
                'SELECT content, sender_id, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 1',
                [chat.chat_id]
            );

            const lastMessage = lastMsgRows[0];
            const partnerId = chat.chat_id.replace('c_', ''); // Extract partner ID from chat ID (e.g., c_alice -> alice)
            const partner = USERS[partnerId];

            if (!partner) {
                console.warn(`[/api/chats] Unknown partner ID: ${partnerId} for chat ${chat.chat_id}`);
                return null;
            }

            console.log(`[/api/chats] Processing chat ${chat.chat_id} with partner ${partner.name}`);

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

        // Filter out any null entries
        const validChats = chats.filter(c => c !== null);

        console.log(`[/api/chats] Returning ${validChats.length} valid chats`);
        res.status(200).json({ chats: validChats });
    } catch (error) {
        console.error('[/api/chats] Error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    } finally {
        client.release();
    }
}
