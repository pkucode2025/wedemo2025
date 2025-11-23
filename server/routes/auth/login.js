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

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, password } = req.body;
    console.log(`[/api/auth/login] Login attempt for username: ${username}`);

    if (!username || !password) {
        return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const client = await pool.connect();
    try {
        // Find user by username
        const { rows } = await client.query(
            'SELECT user_id, username, password_hash, display_name, avatar_url FROM users WHERE username = $1',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const user = rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // Generate simple token
        const token = Buffer.from(`${user.user_id}:${Date.now()}`).toString('base64');

        console.log(`[/api/auth/login] Login successful for user: ${user.user_id}`);

        res.status(200).json({
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
        console.error('[/api/auth/login] Error:', error);
        res.status(500).json({ error: '登录失败，请稍后重试' });
    } finally {
        client.release();
    }
}
