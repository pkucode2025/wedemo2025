const express = require('express');
const { createClient } = require('@vercel/postgres');

const app = express();
app.use(express.json());

// Helper to get DB client
const getClient = () => {
  const client = createClient();
  return client;
};

// Route: /api/setup
app.get('/api/setup', async (req, res) => {
  const client = getClient();
  try {
    await client.connect();
    const result = await client.sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    res.json({ result });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Route: /api/messages
app.get('/api/messages', async (req, res) => {
  const { chatId } = req.query;
  if (!chatId) return res.status(400).json({ error: 'Chat ID is required' });

  const client = getClient();
  try {
    await client.connect();
    const { rows } = await client.sql`
      SELECT * FROM messages 
      WHERE chat_id = ${chatId} 
      ORDER BY created_at ASC;
    `;
    res.json({ messages: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/messages', async (req, res) => {
  const { chatId } = req.query;
  const { content, senderId } = req.body;

  if (!chatId || !content || !senderId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = getClient();
  try {
    await client.connect();
    const { rows } = await client.sql`
      INSERT INTO messages (content, sender_id, chat_id)
      VALUES (${content}, ${senderId}, ${chatId})
      RETURNING *;
    `;
    res.json({ message: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Export for Vercel
module.exports = app;
