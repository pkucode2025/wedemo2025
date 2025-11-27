import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Invalid token format' });
    }

    // Simple token validation (userId:timestamp)
    const [userId] = Buffer.from(token, 'base64').toString().split(':');
    if (!userId) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    let client;
    try {
        client = await pool.connect();

        if (req.method === 'GET') {
            // Get capsules for the user (received)
            const { rows } = await client.query(`
        SELECT c.*, u.display_name as sender_name, u.avatar_url as sender_avatar
        FROM capsules c
        JOIN users u ON c.sender_id = u.user_id
        WHERE c.receiver_id = $1
        ORDER BY c.created_at DESC
      `, [userId]);

            return res.status(200).json({ capsules: rows });
        }

        if (req.method === 'POST') {
            // Create a new capsule
            const { receiverId, content, mediaUrl, unlockAt } = req.body;

            if (!receiverId || !unlockAt) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const { rows } = await client.query(`
        INSERT INTO capsules (sender_id, receiver_id, content, media_url, unlock_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userId, receiverId, content, mediaUrl, unlockAt]);

            return res.status(201).json({ capsule: rows[0] });
        }

        if (req.method === 'PUT') {
            // Open a capsule (mark as opened)
            const { capsuleId } = req.body;

            // Verify ownership and unlock time
            const { rows: checkRows } = await client.query(`
        SELECT * FROM capsules WHERE id = $1 AND receiver_id = $2
      `, [capsuleId, userId]);

            if (checkRows.length === 0) {
                return res.status(404).json({ error: 'Capsule not found' });
            }

            const capsule = checkRows[0];
            if (new Date(capsule.unlock_at) > new Date()) {
                return res.status(403).json({ error: 'Capsule is not ready to open yet' });
            }

            const { rows } = await client.query(`
        UPDATE capsules SET is_opened = TRUE WHERE id = $1 RETURNING *
      `, [capsuleId]);

            return res.status(200).json({ capsule: rows[0] });
        }

        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);

    } catch (error) {
        console.error('Capsule API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (client) client.release();
    }
}
