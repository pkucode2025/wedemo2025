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

// Initial messages to seed the database
const INITIAL_DATA = {
    messages: [
        // Alice's messages
        { chat_id: 'c_alice', sender_id: 'alice', content: 'Hey! 你在忙吗？', delay: 0 },
        { chat_id: 'c_alice', sender_id: 'me', content: '没有，怎么了？', delay: 100 },
        { chat_id: 'c_alice', sender_id: 'alice', content: '周末一起出去玩吧！', delay: 200 },

        // Bob's messages  
        { chat_id: 'c_bob', sender_id: 'bob', content: '明天的会议准备好了吗？', delay: 300 },
        { chat_id: 'c_bob', sender_id: 'me', content: '还在准备中...', delay: 400 },

        // Gemini's messages
        { chat_id: 'c_gemini', sender_id: 'gemini', content: 'Hello! I am Gemini AI. How can I help you today?', delay: 500 },
        { chat_id: 'c_gemini', sender_id: 'me', content: 'Hi Gemini!', delay: 600 },
    ]
};

export default async function handler(req, res) {
    const { force } = req.query; // Allow force reset
    console.log(`[/api/setup] Request received, force=${force}`);

    const client = await pool.connect();
    try {
        console.log('[/api/setup] Creating table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('[/api/setup] Table created successfully');

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
            console.log('[/api/setup] All messages cleared');
        }

        // Seed if database is empty
        const { rows: checkMessages } = await client.query(
            'SELECT COUNT(*) as count FROM messages'
        );
        const currentCount = parseInt(checkMessages[0].count);

        if (currentCount === 0) {
            console.log('[/api/setup] Seeding initial data...');

            for (const msg of INITIAL_DATA.messages) {
                // Insert with slight time offset to preserve order
                await client.query(
                    `INSERT INTO messages (content, sender_id, chat_id, created_at) 
           VALUES ($1, $2, $3, NOW() - INTERVAL '${msg.delay} seconds')`,
                    [msg.content, msg.sender_id, msg.chat_id]
                );
                seededCount++;
            }

            console.log(`[/api/setup] Seeded ${seededCount} initial messages`);
        }

        // Get final count and chat info
        const { rows: finalMessages } = await client.query(
            'SELECT chat_id, COUNT(*) as count FROM messages GROUP BY chat_id'
        );

        res.status(200).json({
            message: "Database initialized successfully",
            seeded: seededCount > 0,
            seededCount,
            totalMessages: currentCount + seededCount,
            chats: finalMessages.map(r => ({ chatId: r.chat_id, messageCount: parseInt(r.count) }))
        });
    } catch (error) {
        console.error('[/api/setup] Error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    } finally {
        client.release();
    }
}
