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

function validateToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId, timestamp] = decoded.split(':');
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(timestamp) > thirtyDays) {
            return null;
        }
        return userId;
    } catch (error) {
        return null;
    }
}

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权' });
    }
    const token = authHeader.substring(7);
    const currentUserId = validateToken(token);
    if (!currentUserId) {
        return res.status(401).json({ error: '无效token' });
    }

    const client = await pool.connect();
    try {
        // Follow a user
        if (req.method === 'POST' && !req.url.includes('/check')) {
            const targetUserId = req.url.split('/').pop();

            if (!targetUserId || targetUserId === currentUserId) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }

            console.log(`[/api/follows] ${currentUserId} following ${targetUserId}`);

            // Check if already following
            const { rows: existing } = await client.query(
                'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
                [currentUserId, targetUserId]
            );

            if (existing.length > 0) {
                return res.status(400).json({ error: 'Already following' });
            }

            await client.query(
                'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
                [currentUserId, targetUserId]
            );

            return res.status(200).json({ success: true, message: 'Followed successfully' });
        }

        // Unfollow a user
        if (req.method === 'DELETE') {
            const targetUserId = req.url.split('/').pop();

            if (!targetUserId) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }

            console.log(`[/api/follows] ${currentUserId} unfollowing ${targetUserId}`);

            await client.query(
                'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
                [currentUserId, targetUserId]
            );

            return res.status(200).json({ success: true, message: 'Unfollowed successfully' });
        }

        // Check if following a user
        if (req.method === 'GET' && req.url.includes('/check/')) {
            const targetUserId = req.url.split('/check/')[1];

            const { rows } = await client.query(
                'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
                [currentUserId, targetUserId]
            );

            return res.status(200).json({ isFollowing: rows.length > 0 });
        }

        // Get following list
        if (req.method === 'GET' && req.url.includes('/following')) {
            console.log(`[/api/follows] Getting following for user: ${currentUserId}`);

            const { rows } = await client.query(`
        SELECT u.user_id, u.username, u.display_name, u.avatar_url, f.created_at
        FROM follows f
        JOIN users u ON f.following_id = u.user_id
        WHERE f.follower_id = $1
        ORDER BY f.created_at DESC
      `, [currentUserId]);

            const following = rows.map(row => ({
                userId: row.user_id,
                username: row.username,
                displayName: row.display_name,
                avatar: row.avatar_url,
                followedAt: row.created_at
            }));

            return res.status(200).json({ following });
        }

        // Get followers list
        if (req.method === 'GET' && req.url.includes('/followers')) {
            console.log(`[/api/follows] Getting followers for user: ${currentUserId}`);

            const { rows } = await client.query(`
        SELECT u.user_id, u.username, u.display_name, u.avatar_url, f.created_at
        FROM follows f
        JOIN users u ON f.follower_id = u.user_id
        WHERE f.following_id = $1
        ORDER BY f.created_at DESC
      `, [currentUserId]);

            const followers = rows.map(row => ({
                userId: row.user_id,
                username: row.username,
                displayName: row.display_name,
                avatar: row.avatar_url,
                followedAt: row.created_at
            }));

            return res.status(200).json({ followers });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('[/api/follows] Error:', error);
        return res.status(500).json({ error: '操作失败' });
    } finally {
        client.release();
    }
}
