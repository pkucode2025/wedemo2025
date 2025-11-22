const client = createClient();
await client.connect();

try {
    if (request.method === 'GET') {
        const { rows } = await client.sql`
        SELECT * FROM messages 
        WHERE chat_id = ${chatId} 
        ORDER BY created_at ASC;
      `;
        return response.status(200).json({ messages: rows });
    } else if (request.method === 'POST') {
        const { content, senderId } = request.body;
        if (!content || !senderId) {
            return response.status(400).json({ error: 'Missing content or senderId' });
        }

        const { rows } = await client.sql`
        INSERT INTO messages (content, sender_id, chat_id)
        VALUES (${content}, ${senderId}, ${chatId})
        RETURNING *;
      `;

        return response.status(200).json({ message: rows[0] });
    }

    return response.status(405).json({ error: 'Method not allowed' });
} catch (error: any) {
    return response.status(500).json({ error: error.message });
} finally {
    await client.end();
}
}
