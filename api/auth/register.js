import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

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

// Generate a simple user ID
function generateUserId() {
    return 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, password, displayName } = req.body;
    console.log(`[/api/auth/register] Registration attempt for username: ${username}`);

    if (!username || !password || !displayName) {
        return res.status(400).json({ error: '缺少必填字段' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: '密码至少需要6个字符' });
    }

    const client = await pool.connect();
    try {
        // Check if username already exists
        const { rows: existingUsers } = await client.query(
            'SELECT user_id FROM users WHERE username = $1',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: '用户名已被使用' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate unique user ID
        const userId = generateUserId();

        // Create user
        const { rows } = await client.query(
            `INSERT INTO users (user_id, username, password_hash, display_name, avatar_url) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, username, display_name, avatar_url, created_at`,
            [userId, username, passwordHash, displayName, 'https://picsum.photos/id/64/200/200']
        );

        const user = rows[0];

        // Generate simple token (userId:timestamp)
        const token = Buffer.from(`${user.user_id}:${Date.now()}`).toString('base64');

        console.log(`[/api/auth/register] User registered successfully: ${userId}`);

        res.status(201).json({
            success: true,
            token,
            user: {
                userId: user.user_id,
                username: user.username,
                displayName: user.display_name,
                avatar: user.avatar_url
            }
        });
    } catch (error) {
        console.error('[/api/auth/register] Error:', error);
        res.status(500).json({ error: '注册失败，请稍后重试' });
    } finally {
        client.release();
    }
}
