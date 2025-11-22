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
    {
        chatId: 'c_bob',
        messages: [
            { sender: 'bob', content: '明天的项目会议准备好了吗？', time: daysAgo(1) },
            { sender: 'me', content: '还在准备PPT，今晚应该能完成', time: daysAgo(1) - 600 },
            { sender: 'bob', content: '记得把数据分析部分重点展示一下', time: daysAgo(1) - 1200 },
            { sender: 'me', content: '好的，已经做了详细的图表', time: hoursAgo(18) },
        ]
    },
    {
        chatId: 'c_carol',
        messages: [
            { sender: 'carol', content: '那个设计稿能发给我看看吗？', time: daysAgo(1) + hoursAgo(6) },
            { sender: 'me', content: '稍等，我整理一下', time: daysAgo(1) + hoursAgo(6) - 300 },
            { sender: 'me', content: '[图片] 这是最新版本', time: daysAgo(1) + hoursAgo(6) - 600 },
            { sender: 'carol', content: '看起来不错！配色很棒 👍', time: daysAgo(1) + hoursAgo(6) - 900 },
            { sender: 'carol', content: '不过能把字体改大一点吗？', time: hoursAgo(12) },
        ]
    },
    {
        chatId: 'c_david',
        messages: [
            { sender: 'david', content: '晚上一起吃饭吗？', time: hoursAgo(8) },
            { sender: 'me', content: '好啊，去哪里？', time: hoursAgo(8) - 300 },
            { sender: 'david', content: '新开的日料店，听说很不错', time: hoursAgo(7) },
        ]
    },
    {
        chatId: 'c_emma',
        messages: [
            { sender: 'emma', content: '看到你朋友圈那张照片了！', time: hoursAgo(5) },
            { sender: 'emma', content: '在哪里拍的？好美 😍', time: hoursAgo(5) - 100 },
            { sender: 'me', content: '上周去西湖玩的时候拍的', time: hoursAgo(4) },
            { sender: 'emma', content: '我也想去！下次一起吧', time: hoursAgo(3) },
        ]
    },
    {
        chatId: 'c_frank',
        messages: [
            { sender: 'frank', content: '代码review看完了吗？', time: hoursAgo(2) },
            { sender: 'me', content: '看完了，整体没问题', time: hoursAgo(2) - 300 },
            { sender: 'me', content: '有几个小建议我直接写在PR里了', time: hoursAgo(2) - 400 },
        ]
    },
    {
        chatId: 'c_grace',
        messages: [
            { sender: 'grace', content: '生日派对确定要来哦！', time: hoursAgo(24) },
            { sender: 'me', content: '一定到！需要我带什么吗？', time: hoursAgo(23) },
            { sender: 'grace', content: '带你自己就行 😄', time: hoursAgo(22) },
        ]
    },
    {
        chatId: 'c_gemini',
        messages: [
            { sender: 'gemini', content: 'Hello! I am Gemini AI, your smart assistant. How can I help you today?', time: daysAgo(3) },
            { sender: 'me', content: 'Hi! Can you help me with coding questions?', time: daysAgo(3) - 600 },
            { sender: 'gemini', content: 'Of course! I can help with programming, debugging, code reviews, and more. What would you like to know?', time: daysAgo(3) - 1200 },
        ]
    },
    {
        chatId: 'c_henry',
        messages: [
            { sender: 'henry', content: '健身房见！💪', time: hoursAgo(6) },
            { sender: 'me', content: 'OK，路上了', time: hoursAgo(6) - 300 },
        ]
    },
];

export default async function handler(req, res) {
    const { force } = req.query;
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

        // Check if seeding is needed
        const { rows: checkMessages } = await client.query(
            'SELECT COUNT(*) as count FROM messages'
        );
        const currentCount = parseInt(checkMessages[0].count);

        if (currentCount === 0) {
            console.log('[/api/setup] Seeding conversations...');

            // Insert all conversations
            for (const conversation of CONVERSATIONS) {
                console.log(`[/api/setup] Seeding chat: ${conversation.chatId}`);

                for (const msg of conversation.messages) {
                    await client.query(
                        `INSERT INTO messages (content, sender_id, chat_id, created_at) 
             VALUES ($1, $2, $3, NOW() - INTERVAL '${msg.time} seconds')`,
                        [msg.content, msg.sender, conversation.chatId]
                    );
                    seededCount++;
                }
            }

            console.log(`[/api/setup] Seeded ${seededCount} messages across ${CONVERSATIONS.length} conversations`);
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

        res.status(200).json({
            success: true,
            message: "Database initialized successfully",
            seeded: seededCount > 0,
            seededCount,
            totalMessages: currentCount + seededCount,
            conversations: CONVERSATIONS.length,
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
