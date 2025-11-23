import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);

    // Verify admin token
    if (token !== 'admin-secret-token-888') {
        return res.status(403).json({ error: 'Forbidden: Invalid admin token' });
    }

    const client = await pool.connect();
    try {
        // GET /api/admin/stats
        if (req.method === 'GET' && req.url.includes('/stats')) {
            const usersCount = await client.query('SELECT COUNT(*) FROM users');
            const momentsCount = await client.query('SELECT COUNT(*) FROM moments');
            const commentsCount = await client.query("SELECT SUM(jsonb_array_length(comments)) FROM moments WHERE comments IS NOT NULL AND comments::text != 'null'");
            const likesCount = await client.query("SELECT SUM(jsonb_array_length(likes)) FROM moments WHERE likes IS NOT NULL AND likes::text != 'null'");

            return res.status(200).json({
                users: parseInt(usersCount.rows[0].count),
                moments: parseInt(momentsCount.rows[0].count),
                comments: parseInt(commentsCount.rows[0].sum || 0),
                likes: parseInt(likesCount.rows[0].sum || 0)
            });
        }

        // GET /api/admin/users
        if (req.method === 'GET' && req.url.includes('/users')) {
            const { rows } = await client.query('SELECT id, user_id, username, display_name, avatar_url, is_admin, created_at FROM users ORDER BY created_at DESC');
            return res.status(200).json({ users: rows });
        }

        // PUT /api/admin/users/:id
        if (req.method === 'PUT' && req.url.includes('/users/')) {
            const targetUserId = req.url.split('/users/')[1];
            const { display_name, bio, is_admin, password } = req.body;

            const updates = [];
            const values = [];
            let paramCount = 1;

            if (display_name !== undefined) {
                updates.push(`display_name = $${paramCount++}`);
                values.push(display_name);
            }
            if (bio !== undefined) {
                updates.push(`bio = $${paramCount++}`);
                values.push(bio);
            }
            if (is_admin !== undefined) {
                updates.push(`is_admin = $${paramCount++}`);
                values.push(is_admin);
            }
            if (password !== undefined) {
                updates.push(`password_hash = $${paramCount++}`);
                values.push(password);
            }

            if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

            values.push(targetUserId);
            const query = `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${paramCount} RETURNING *`;

            const { rows } = await client.query(query, values);
            return res.status(200).json({ user: rows[0] });
        }

        // DELETE /api/admin/users/:id
        if (req.method === 'DELETE' && req.url.includes('/users/')) {
            const targetUserId = req.url.split('/users/')[1];

            await client.query('DELETE FROM moments WHERE user_id = $1', [targetUserId]);
            await client.query('DELETE FROM follows WHERE follower_id = $1 OR following_id = $1', [targetUserId]);
            await client.query('DELETE FROM favorites WHERE user_id = $1', [targetUserId]);
            await client.query('DELETE FROM users WHERE user_id = $1', [targetUserId]);

            return res.status(200).json({ success: true });
        }

        // GET /api/admin/moments
        if (req.method === 'GET' && req.url.includes('/moments')) {
            const { rows } = await client.query(`
                SELECT m.*, u.display_name, u.avatar_url 
                FROM moments m 
                JOIN users u ON m.user_id = u.user_id 
                ORDER BY m.created_at DESC
            `);
            return res.status(200).json({ moments: rows });
        }

        // DELETE /api/admin/moments/:id
        if (req.method === 'DELETE' && req.url.includes('/moments/')) {
            const momentId = req.url.split('/moments/')[1];
            await client.query('DELETE FROM moments WHERE id = $1', [momentId]);
            await client.query('DELETE FROM favorites WHERE moment_id = $1', [momentId]);
            return res.status(200).json({ success: true });
        }

        // GET /api/admin/chats
        if (req.method === 'GET' && req.url.includes('/chats') && !req.url.includes('/messages')) {
            const { rows } = await client.query(`
                WITH chat_messages AS (
                    SELECT 
                        chat_id,
                        MAX(created_at) as last_message_time,
                        COUNT(*) as message_count,
                        array_agg(DISTINCT sender_id) as participants
                    FROM messages
                    GROUP BY chat_id
                )
                SELECT 
                    cm.chat_id,
                    cm.last_message_time,
                    cm.message_count,
                    m.content as last_message,
                    array_agg(u.display_name) FILTER (WHERE u.display_name IS NOT NULL) as participant_names
                FROM chat_messages cm
                LEFT JOIN LATERAL (
                    SELECT content 
                    FROM messages 
                    WHERE chat_id = cm.chat_id 
                    ORDER BY created_at DESC 
                    LIMIT 1
                ) m ON true
                LEFT JOIN LATERAL unnest(cm.participants) participant_id ON true
                LEFT JOIN users u ON u.user_id = participant_id
                GROUP BY cm.chat_id, cm.last_message_time, cm.message_count, m.content
                ORDER BY cm.last_message_time DESC
            `);
            return res.status(200).json({ chats: rows });
        }

        // GET /api/admin/chats/:chatId/messages
        if (req.method === 'GET' && req.url.includes('/chats/') && req.url.includes('/messages')) {
            const chatId = req.url.split('/chats/')[1].split('/messages')[0];

            const { rows } = await client.query(`
                SELECT 
                    m.*,
                    u.display_name,
                    u.avatar_url
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.user_id
                WHERE m.chat_id = $1
                ORDER BY m.created_at ASC
            `, [chatId]);

            return res.status(200).json({ messages: rows });
        }

        // DELETE /api/admin/chats/:chatId
        if (req.method === 'DELETE' && req.url.includes('/chats/') && !req.url.includes('/messages')) {
            const chatId = req.url.split('/chats/')[1];

            await client.query('DELETE FROM messages WHERE chat_id = $1', [chatId]);
            await client.query('DELETE FROM chat_read_status WHERE chat_id = $1', [chatId]);
            await client.query('DELETE FROM chat_settings WHERE chat_id = $1', [chatId]);

            return res.status(200).json({ success: true });
        }

        // DELETE /api/admin/messages/:messageId
        if (req.method === 'DELETE' && req.url.includes('/messages/') && !req.url.includes('/search') && !req.url.includes('/bulk')) {
            const messageId = req.url.split('/messages/')[1];
            await client.query('DELETE FROM messages WHERE id = $1', [messageId]);
            return res.status(200).json({ success: true });
        }

        // GET /api/admin/groups
        if (req.method === 'GET' && (req.url === '/groups' || req.url === '/groups/')) {
            const { rows } = await client.query(`
                SELECT 
                    g.*,
                    u.display_name as owner_name,
                    COUNT(DISTINCT gm.user_id) as member_count,
                    COUNT(DISTINCT m.id) as message_count
                FROM groups g
                LEFT JOIN users u ON g.owner_id = u.user_id
                LEFT JOIN group_members gm ON g.group_id = gm.group_id
                LEFT JOIN messages m ON m.chat_id = g.group_id
                GROUP BY g.group_id, g.name, g.owner_id, g.avatar_url, g.created_at, u.display_name
                ORDER BY g.created_at DESC
            `);
            return res.status(200).json({ groups: rows });
        }

        // GET /api/admin/groups/:groupId/members
        if (req.method === 'GET' && req.url.includes('/groups/') && req.url.includes('/members')) {
            const groupId = req.url.split('/groups/')[1].split('/members')[0];

            const { rows } = await client.query(`
                SELECT 
                    gm.*,
                    u.user_id,
                    u.username,
                    u.display_name,
                    u.avatar_url
                FROM group_members gm
                JOIN users u ON gm.user_id = u.user_id
                WHERE gm.group_id = $1
                ORDER BY gm.joined_at ASC
            `, [groupId]);

            return res.status(200).json({ members: rows });
        }

        // DELETE /api/admin/groups/:groupId/members/:userId
        if (req.method === 'DELETE' && req.url.includes('/groups/') && req.url.includes('/members/')) {
            const parts = req.url.split('/');
            const groupIdx = parts.indexOf('groups');
            const memberIdx = parts.indexOf('members');
            const groupId = parts[groupIdx + 1];
            const userId = parts[memberIdx + 1];

            await client.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
            return res.status(200).json({ success: true });
        }

        // POST /api/admin/groups/:groupId/members
        if (req.method === 'POST' && req.url.includes('/groups/') && req.url.includes('/members')) {
            const groupId = req.url.split('/groups/')[1].split('/members')[0];
            const { userId } = req.body;

            await client.query(
                'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [groupId, userId]
            );

            return res.status(200).json({ success: true });
        }

        // GET /api/admin/groups/:groupId/messages
        if (req.method === 'GET' && req.url.includes('/groups/') && req.url.includes('/messages')) {
            const groupId = req.url.split('/groups/')[1].split('/messages')[0];

            const { rows } = await client.query(`
                SELECT 
                    m.*,
                    u.display_name,
                    u.avatar_url
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.user_id
                WHERE m.chat_id = $1
                ORDER BY m.created_at DESC
            `, [groupId]);

            return res.status(200).json({ messages: rows });
        }

        // DELETE /api/admin/groups/:groupId
        if (req.method === 'DELETE' && req.url.includes('/groups/')) {
            const groupId = req.url.split('/groups/')[1];

            await client.query('DELETE FROM messages WHERE chat_id = $1', [groupId]);
            await client.query('DELETE FROM group_members WHERE group_id = $1', [groupId]);
            await client.query('DELETE FROM groups WHERE group_id = $1', [groupId]);

            return res.status(200).json({ success: true });
        }

        // GET /api/admin/messages/search
        if (req.method === 'GET' && req.url.includes('/messages/search')) {
            const urlObj = new URL(req.url, `http://localhost`);
            const query = urlObj.searchParams.get('q') || '';

            const { rows } = await client.query(`
                SELECT 
                    m.*,
                    u.display_name,
                    u.avatar_url
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.user_id
                WHERE m.content ILIKE $1
                ORDER BY m.created_at DESC
                LIMIT 100
            `, [`%${query}%`]);

            return res.status(200).json({ messages: rows });
        }

        // DELETE /api/admin/messages/bulk
        if (req.method === 'DELETE' && req.url.includes('/messages/bulk')) {
            const { messageIds } = req.body;

            if (!Array.isArray(messageIds) || messageIds.length === 0) {
                return res.status(400).json({ error: 'Invalid messageIds' });
            }

            await client.query('DELETE FROM messages WHERE id = ANY($1)', [messageIds]);
            return res.status(200).json({ success: true, deleted: messageIds.length });
        }

        // GET /api/admin/analytics/users
        if (req.method === 'GET' && req.url.includes('/analytics/users')) {
            const { rows } = await client.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as user_count
                FROM users
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 30
            `);

            const totalUsers = await client.query('SELECT COUNT(*) FROM users');

            return res.status(200).json({
                daily: rows,
                total: parseInt(totalUsers.rows[0].count)
            });
        }

        // GET /api/admin/analytics/activity
        if (req.method === 'GET' && req.url.includes('/analytics/activity')) {
            const messages = await client.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM messages
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 30
            `);

            const moments = await client.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM moments
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 30
            `);

            return res.status(200).json({
                messages: messages.rows,
                moments: moments.rows
            });
        }

        return res.status(404).json({ error: 'Not found' });

    } catch (error) {
        console.error('[/api/admin] Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
