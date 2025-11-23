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
    } catch (e) {
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
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Following count (使用 follows 表)
        const { rows: followingRows } = await client.query(
            'SELECT COUNT(*) FROM follows WHERE follower_id = $1',
            [currentUserId]
        );
        const followingCount = parseInt(followingRows[0].count, 10);

        // Followers count (使用 follows 表)
        const { rows: followersRows } = await client.query(
            'SELECT COUNT(*) FROM follows WHERE following_id = $1',
            [currentUserId]
        );
        const followersCount = parseInt(followersRows[0].count, 10);

        // Friends count (好友系统，独立统计)
        const { rows: friendsRows } = await client.query(
            'SELECT COUNT(*) FROM friendships WHERE user_id = $1',
            [currentUserId]
        );
        const friendsCount = parseInt(friendsRows[0].count, 10);

        // Likes count
        const { rows: likesRows } = await client.query(
            'SELECT COUNT(*) FROM moments WHERE $1 = ANY(likes)',
            [currentUserId]
        );
        const likesCount = parseInt(likesRows[0].count, 10);

        // Favorites count
        const { rows: favoritesRows } = await client.query(
            'SELECT COUNT(*) FROM favorites WHERE user_id = $1',
            [currentUserId]
        );
        const favoritesCount = parseInt(favoritesRows[0].count, 10);

        return res.status(200).json({
            followingCount,
            followersCount,
            friendsCount,
            likesCount,
            favoritesCount,
        });
    } catch (e) {
        console.error('[/api/me] Error:', e);
        return res.status(500).json({ error: '操作失败' });
    } finally {
        client.release();
    }
}
