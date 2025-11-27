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

function validateToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId, timestamp] = decoded.split(':');
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(timestamp) > thirtyDays) {
            return null;
        }
        return userId;
    } catch (e) {
        return null;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权' });
    }

    const token = authHeader.substring(7);
    const currentUserId = validateToken(token);
    if (!currentUserId) {
        return res.status(401).json({ error: '无效token' });
    }

    const { displayName, bio, avatar_url } = req.body;

    let client;
    try {
        client = await pool.connect();

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (displayName !== undefined && displayName.trim()) {
            updates.push(`display_name = $${paramCount++}`);
            values.push(displayName.trim());
        }

        if (bio !== undefined) {
            updates.push(`bio = $${paramCount++}`);
            values.push(bio);
        }

        if (avatar_url !== undefined && avatar_url.trim()) {
            updates.push(`avatar_url = $${paramCount++}`);
            values.push(avatar_url.trim());
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: '没有要更新的字段' });
        }

        values.push(currentUserId);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${paramCount} RETURNING user_id, username, display_name, avatar_url, bio`;

        const { rows } = await client.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }

        const user = rows[0];

        return res.status(200).json({
            success: true,
            user: {
                userId: user.user_id,
                username: user.username,
                displayName: user.display_name,
                avatar: user.avatar_url,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('[/api/me/update] Error:', error);
        return res.status(500).json({ error: '更新失败' });
    } finally {
        if (client) client.release();
    }
}

