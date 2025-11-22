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
        { chat_id: 'c_alice', sender_id: 'alice', content: 'Hey! 你在忙吗？' },
        { chat_id: 'c_alice', sender_id: 'me', content: '没有，怎么了？' },
        { chat_id: 'c_alice', sender_id: 'alice', content: '周末一起出去玩吧！' },

        // Bob's messages  
        { chat_id: 'c_bob', sender_id: 'bob', content: '明天的会议准备好了吗？' },
        { chat_id: 'c_bob', sender_id: 'me', content: '还在准备中...' },

        // Carol's messages
        { chat_id: 'c_carol', sender_id: 'carol', content: '那个文件发给我一下' },
        { chat_id: 'c_carol', sender_id: 'me', content: '好的，稍等' },
        { chat_id: 'c_carol', sender_id: 'carol', content: '谢谢！' },
    ]
};

export default async function handler(req, res) {
    console.log('[/api/setup] Request received');

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

        // Check if we need to seed data
        const { rows: existingMessages } = await client.query(
            'SELECT COUNT(*) as count FROM messages'
        );
        const messageCount = parseInt(existingMessages[0].count);
        console.log(`[/api/setup] Found ${messageCount} existing messages`);

        let seededCount = 0;
        if (messageCount === 0) {
            console.log('[/api/setup] No messages found, seeding initial data...');

            for (const msg of INITIAL_DATA.messages) {
                await client.query(
                    'INSERT INTO messages (content, sender_id, chat_id) VALUES ($1, $2, $3)',
                    [msg.content, msg.sender_id, msg.chat_id]
                );
                seededCount++;
            }

            console.log(`[/api/setup] Seeded ${seededCount} initial messages`);
        }

        res.status(200).json({
            message: "Database initialized successfully",
            seeded: seededCount > 0,
            seededCount
        });
    } catch (error) {
        console.error('[/api/setup] Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
