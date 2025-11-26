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

// 验证token
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
    // 验证用户身份
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
        if (req.method === 'POST') {
            // 创建群组
            const { name, memberIds } = req.body;

            if (!name || !memberIds || !Array.isArray(memberIds)) {
                return res.status(400).json({ error: 'Invalid input' });
            }

            console.log(`[/api/groups] Creating group '${name}' with members:`, memberIds);

            await client.query('BEGIN');

            // 1. Create group
            const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const { rows: groupRows } = await client.query(
                'INSERT INTO groups (group_id, name, owner_id) VALUES ($1, $2, $3) RETURNING *',
                [groupId, name, currentUserId]
            );
            const group = groupRows[0];

            // 2. Add owner as member
            await client.query(
                'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
                [groupId, currentUserId]
            );

            // 3. Add other members
            for (const memberId of memberIds) {
                if (memberId !== currentUserId) {
                    await client.query(
                        'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [groupId, memberId]
                    );
                }
            }

            // 4. Create initial system message
            const initialMsg = `"${name}" created.`;
            await client.query(
                'INSERT INTO messages (content, sender_id, chat_id, created_at) VALUES ($1, $2, $3, NOW())',
                [initialMsg, 'system', groupId]
            );

            await client.query('COMMIT');

            console.log(`[/api/groups] Group created: ${groupId}`);

            res.status(200).json({
                success: true,
                group: {
                    id: group.group_id,
                    name: group.name,
                    avatar: group.avatar_url,
                    ownerId: group.owner_id
                }
            });

        } else if (req.method === 'GET') {
            // 获取我的群组
            console.log(`[/api/groups] Getting groups for user: ${currentUserId}`);

            const { rows } = await client.query(`
                SELECT g.group_id, g.name, g.avatar_url, g.owner_id, gm.joined_at
                FROM groups g
                JOIN group_members gm ON g.group_id = gm.group_id
                WHERE gm.user_id = $1
                ORDER BY gm.joined_at DESC
            `, [currentUserId]);

            const groups = rows.map(g => ({
                id: g.group_id,
                name: g.name,
                avatar: g.avatar_url,
                ownerId: g.owner_id,
                joinedAt: g.joined_at
            }));

            res.status(200).json({ groups });

        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[/api/groups] Error:', error);
        res.status(500).json({ error: '操作失败' });
    } finally {
        client.release();
    }
}
