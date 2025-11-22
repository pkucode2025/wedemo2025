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

// Helper function to create timestamp offsets (in seconds ago)
const hoursAgo = (hours) => hours * 3600;
const daysAgo = (days) => days * 86400;

// Rich conversation dataset with realistic scenarios
const CONVERSATIONS = [
    {
        chatId: 'c_alice',
        messages: [
            { sender: 'alice', content: 'Hey! 周末有空吗？', time: daysAgo(2) },
            { sender: 'me', content: '应该有空，怎么了？', time: daysAgo(2) - 300 },
            { sender: 'alice', content: '一起去看电影吧！新上映的科幻片评价很好', time: daysAgo(2) - 600 },
            { sender: 'me', content: '好啊！周六下午怎么样？', time: daysAgo(2) - 900 },
            { sender: 'alice', content: '完美！我去订票 🎬', time: daysAgo(2) - 1200 },
        ]
    },
];

export default async function handler(req, res) {
    const { force } = req.query;
    console.log(`[/api/setup] Request received, force=${force}`);

    const client = await pool.connect();
    try {
        console.log('[/api/setup] Creating tables...');

        // 1. Messages table
        await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('[/api/setup] Messages table ready');

        // 2. Users table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        avatar_url TEXT DEFAULT 'https://picsum.photos/id/64/200/200',
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('[/api/setup] Users table ready');

        // 3. Friendships table
        await client.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        friend_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id)
      );
    `);
        console.log('[/api/setup] Friendships table ready');

        // 4. Password reset tokens table
        await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        token VARCHAR(100) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('[/api/setup] Password reset tokens table ready');

        // 5. Chat read status table (for unread counts)
        await client.query(`
      CREATE TABLE IF NOT EXISTS chat_read_status (
        id SERIAL PRIMARY KEY,
        chat_id TEXT NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chat_id, user_id)
      );
    `);
        console.log('[/api/setup] Chat read status table ready');

        // Check existing messages
        const { rows: existingMessages } = await client.query(
            'SELECT COUNT(*) as count FROM messages'
        );
        const messageCount = parseInt(existingMessages[0].count);
        console.log(`[/api/setup] Found ${messageCount} existing messages`);

        let seededCount = 0;

        // Force reset if requested
        if (force === 'true') {
            console.log('[/api/setup] Force flag detected, clearing all messages...');
            await client.query('DELETE FROM messages');
            await client.query('DELETE FROM chat_read_status');
            console.log('[/api/setup] All messages and read status cleared');
        }

        // Get final statistics
        const { rows: finalStats } = await client.query(`
      SELECT 
        chat_id,
        COUNT(*) as message_count,
        MIN(created_at) as first_message,
        MAX(created_at) as last_message
      FROM messages 
      GROUP BY chat_id
      ORDER BY MAX(created_at) DESC
    `);

        const { rows: userStats } = await client.query('SELECT COUNT(*) as count FROM users');
        const userCount = parseInt(userStats[0].count);

        res.status(200).json({
            success: true,
            message: "Database initialized successfully",
            seeded: seededCount > 0,
            seededCount,
            totalMessages: messageCount,
            totalUsers: userCount,
            chats: finalStats.map(r => ({
                chatId: r.chat_id,
                messageCount: parseInt(r.message_count),
                firstMessage: r.first_message,
                lastMessage: r.last_message,
            }))
        });
    } catch (error) {
        console.error('[/api/setup] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    } finally {
        client.release();
    }
}
