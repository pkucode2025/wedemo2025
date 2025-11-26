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

// Validate token helper
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
    // Authenticate user
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
        // Search users (query param ?q=... or ?search=...)
        if (req.method === 'GET' && (req.query.q || req.query.search)) {
            const query = req.query.q || req.query.search;
            console.log(`[/api/friends] Searching users with query: ${query}`);
            const { rows } = await client.query(
                `SELECT user_id, username, display_name, avatar_url FROM users WHERE username ILIKE $1 OR display_name ILIKE $1 LIMIT 10`,
                [`%${query}%`]
            );
            const users = rows.map(user => ({
                userId: user.user_id,
                username: user.username,
                displayName: user.display_name,
                avatar: user.avatar_url,
            }));
            return res.status(200).json({ users });
        }

        // Get friends list
        if (req.method === 'GET') {
            console.log(`[/api/friends] Getting friends for user: ${currentUserId}`);
            const { rows } = await client.query(
                `SELECT u.user_id, u.username, u.display_name, u.avatar_url, f.created_at FROM friendships f JOIN users u ON (f.friend_id = u.user_id) WHERE f.user_id = $1 ORDER BY u.display_name ASC`,
                [currentUserId]
            );
            const friends = rows.map(friend => ({
                userId: friend.user_id,
                username: friend.username,
                displayName: friend.display_name,
                avatar: friend.avatar_url,
                friendsSince: friend.created_at,
            }));
            console.log(`[/api/friends] Found ${friends.length} friends`);
            return res.status(200).json({ success: true, friends });
        }

        // Add friend
        if (req.method === 'POST') {
            const { friendUserId } = req.body;
            if (!friendUserId) {
                return res.status(400).json({ error: '缺少好友ID' });
            }
            if (friendUserId === currentUserId) {
                return res.status(400).json({ error: '不能添加自己为好友' });
            }
            console.log(`[/api/friends] Adding friend: ${currentUserId} -> ${friendUserId}`);
            // Check existing friendship
            const { rows: existing } = await client.query(
                'SELECT id FROM friendships WHERE user_id = $1 AND friend_id = $2',
                [currentUserId, friendUserId]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: '已经是好友了' });
            }
            // Insert bidirectional friendship
            await client.query('INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2)', [currentUserId, friendUserId]);
            await client.query('INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2)', [friendUserId, currentUserId]);
            // Fetch new friend info
            const { rows: friendInfo } = await client.query(
                'SELECT user_id, username, display_name, avatar_url FROM users WHERE user_id = $1',
                [friendUserId]
            );
            console.log(`[/api/friends] Friend added successfully`);
            return res.status(200).json({
                success: true,
                friend: {
                    userId: friendInfo[0].user_id,
                    username: friendInfo[0].username,
                    displayName: friendInfo[0].display_name,
                    avatar: friendInfo[0].avatar_url,
                },
            });
        }

        // Delete friend
        if (req.method === 'DELETE') {
            const { friendUserId } = req.body;
            if (!friendUserId) {
                return res.status(400).json({ error: '缺少好友ID' });
            }
            console.log(`[/api/friends] Removing friend: ${currentUserId} <- ${friendUserId}`);
            await client.query('DELETE FROM friendships WHERE user_id = $1 AND friend_id = $2', [currentUserId, friendUserId]);
            await client.query('DELETE FROM friendships WHERE user_id = $1 AND friend_id = $2', [friendUserId, currentUserId]);
            return res.status(200).json({ success: true, message: '已删除好友' });
        }

        // Method not allowed
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('[/api/friends] Error:', error);
        return res.status(500).json({ error: '操作失败' });
    } finally {
        client.release();
    }
}
