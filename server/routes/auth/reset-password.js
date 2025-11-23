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

// Generate reset token
function generateResetToken() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

export default async function handler(req, res) {
    const client = await pool.connect();

    try {
        if (req.method === 'POST') {
            // Request password reset
            const { username } = req.body;

            if (!username) {
                return res.status(400).json({ error: '请输入用户名' });
            }

            // Find user
            const { rows } = await client.query(
                'SELECT user_id FROM users WHERE username = $1',
                [username]
            );

            if (rows.length === 0) {
                // Don't reveal if user exists
                return res.status(200).json({
                    success: true,
                    message: '如果用户存在，重置链接已发送'
                });
            }

            const userId = rows[0].user_id;
            const resetToken = generateResetToken();
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour

            // Store reset token
            await client.query(
                'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
                [userId, resetToken, expiresAt]
            );

            // In a real app, send email here
            console.log(`[/api/auth/reset-password] Reset token for ${username}: ${resetToken}`);

            res.status(200).json({
                success: true,
                message: '重置链接已生成',
                resetToken // Only for demo, don't return in production!
            });

        } else if (req.method === 'PUT') {
            // Reset password with token
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({ error: '缺少必填字段' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: '密码至少需要6个字符' });
            }

            // Verify token
            const { rows } = await client.query(
                'SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = $1',
                [token]
            );

            if (rows.length === 0) {
                return res.status(400).json({ error: '无效的重置链接' });
            }

            const resetToken = rows[0];

            if (resetToken.used) {
                return res.status(400).json({ error: '该重置链接已被使用' });
            }

            if (new Date() > new Date(resetToken.expires_at)) {
                return res.status(400).json({ error: '重置链接已过期' });
            }

            // Update password
            const passwordHash = await bcrypt.hash(newPassword, 10);
            await client.query(
                'UPDATE users SET password_hash = $1 WHERE user_id = $2',
                [passwordHash, resetToken.user_id]
            );

            // Mark token as used
            await client.query(
                'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
                [token]
            );

            res.status(200).json({
                success: true,
                message: '密码重置成功'
            });

        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('[/api/auth/reset-password] Error:', error);
        res.status(500).json({ error: '操作失败，请稍后重试' });
    } finally {
        client.release();
    }
}
