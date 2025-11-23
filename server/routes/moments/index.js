import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
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
        if (req.method === 'GET') {
            // Get liked moments
            if (req.url.includes('/liked')) {
                console.log(`[/api/moments] Getting liked moments for user: ${currentUserId}`);
                const { rows: moments } = await client.query(`
                    SELECT m.*, u.display_name, u.avatar_url
                    FROM moments m
                    JOIN users u ON m.user_id = u.user_id
                    WHERE $1 = ANY(m.likes)
                    ORDER BY m.created_at DESC
                `, [currentUserId]);
                return res.status(200).json({ moments });
            }

            // Get favorited moments
            if (req.url.includes('/favorites')) {
                console.log(`[/api/moments] Getting favorited moments for user: ${currentUserId}`);
                const { rows: moments } = await client.query(`
                    SELECT m.*, u.display_name, u.avatar_url
                    FROM moments m
                    JOIN users u ON m.user_id = u.user_id
                    JOIN favorites f ON m.id = f.moment_id
                    WHERE f.user_id = $1
                    ORDER BY f.created_at DESC
                `, [currentUserId]);
                return res.status(200).json({ moments });
            }

            // Get moments feed (self + friends)
            const { rows: friends } = await client.query(
                'SELECT friend_id FROM friendships WHERE user_id = $1',
                [currentUserId]
            );

            const friendIds = friends.map(f => f.friend_id);
            const targetIds = [...friendIds, currentUserId];

            const { rows: moments } = await client.query(`
                SELECT m.*, u.display_name, u.avatar_url
                FROM moments m
                JOIN users u ON m.user_id = u.user_id
                WHERE m.user_id = ANY($1)
                ORDER BY m.created_at DESC
                LIMIT 50
            `, [targetIds]);

            return res.status(200).json({ moments });

        } else if (req.method === 'POST') {
            // Toggle like
            const likeMatch = req.url.match(/\/(\d+)\/like/);
            if (likeMatch) {
                const momentId = likeMatch[1];
                console.log(`[/api/moments] Toggling like for moment ${momentId} by user ${currentUserId}`);

                const { rows } = await client.query(`
                    UPDATE moments
                    SET likes = CASE
                        WHEN likes @> $1::jsonb THEN likes - $2::text
                        ELSE likes || $1::jsonb
                    END
                    WHERE id = $3
                    RETURNING likes
                `, [JSON.stringify([currentUserId]), currentUserId, momentId]);

                if (rows.length === 0) {
                    return res.status(404).json({ error: 'Moment not found' });
                }

                return res.status(200).json({ likes: rows[0].likes });
            }

            // Add comment
            const commentMatch = req.url.match(/\/(\d+)\/comment/);
            if (commentMatch) {
                const momentId = commentMatch[1];
                const { content } = req.body;

                if (!content) {
                    return res.status(400).json({ error: 'Comment content required' });
                }

                console.log(`[/api/moments] Adding comment to moment ${momentId} by user ${currentUserId}`);

                const newComment = {
                    id: Date.now().toString(),
                    userId: currentUserId,
                    content,
                    createdAt: new Date().toISOString()
                };

                const { rows } = await client.query(`
                    UPDATE moments
                    SET comments = comments || $1::jsonb
                    WHERE id = $2
                    RETURNING comments
                `, [JSON.stringify([newComment]), momentId]);

                if (rows.length === 0) {
                    return res.status(404).json({ error: 'Moment not found' });
                }

                const { rows: userRows } = await client.query(
                    'SELECT display_name, avatar_url FROM users WHERE user_id = $1',
                    [currentUserId]
                );

                const returnedComment = {
                    ...newComment,
                    user: {
                        displayName: userRows[0].display_name,
                        avatar: userRows[0].avatar_url
                    }
                };

                return res.status(200).json({ comment: returnedComment });
            }

            // Toggle favorite
            const favoriteMatch = req.url.match(/\/(\d+)\/favorite/);
            if (favoriteMatch) {
                const momentId = favoriteMatch[1];
                console.log(`[/api/moments] Toggling favorite for moment ${momentId} by user ${currentUserId}`);

                const { rows: existing } = await client.query(
                    'SELECT id FROM favorites WHERE user_id = $1 AND moment_id = $2',
                    [currentUserId, momentId]
                );

                if (existing.length > 0) {
                    await client.query(
                        'DELETE FROM favorites WHERE user_id = $1 AND moment_id = $2',
                        [currentUserId, momentId]
                    );
                    return res.status(200).json({ favorited: false });
                } else {
                    await client.query(
                        'INSERT INTO favorites (user_id, moment_id) VALUES ($1, $2)',
                        [currentUserId, momentId]
                    );
                    return res.status(200).json({ favorited: true });
                }
            }

            // Create moment
            const { content, images } = req.body;

            if (!content && (!images || images.length === 0)) {
                return res.status(400).json({ error: '内容不能为空' });
            }

            const { rows } = await client.query(
                'INSERT INTO moments (user_id, content, images) VALUES ($1, $2, $3) RETURNING *',
                [currentUserId, content || '', JSON.stringify(images || [])]
            );

            const { rows: userRows } = await client.query(
                'SELECT display_name, avatar_url FROM users WHERE user_id = $1',
                [currentUserId]
            );

            const newMoment = {
                ...rows[0],
                display_name: userRows[0].display_name,
                avatar_url: userRows[0].avatar_url
            };

            return res.status(201).json({ moment: newMoment });
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('[/api/moments] Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
