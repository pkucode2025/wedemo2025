import express from 'express';
import { createClient } from '@vercel/postgres';

console.log("Initializing API...");

const app = express();
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helper to get DB client with error handling
const getClient = () => {
  console.log("Creating DB client...");
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error("POSTGRES_URL is missing");
    throw new Error("POSTGRES_URL is missing");
  }

  try {
    const client = createClient({ connectionString });
    return client;
  } catch (err) {
    console.error("Failed to create DB client:", err);
    throw err;
  }
};

// Health check route with Env check
app.get('/api/health', (req, res) => {
  console.log("Health check requested");
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      HAS_POSTGRES_URL: !!process.env.POSTGRES_URL,
      HAS_POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING
    }
  });
});

// Route: /api/setup
app.get('/api/setup', async (req, res) => {
  console.log("Setup route hit");
  let client;
  try {
    client = getClient();
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected to database. Executing query...");

    const result = await client.sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("Table creation result:", result);
    res.json({ result, message: "Database initialized successfully" });
  } catch (error) {
    console.error('Setup error details:', error);
    res.status(500).json({
      error: "Setup failed",
      details: error.message,
      stack: error.stack
    });
  } finally {
    if (client) {
      console.log("Closing database connection...");
      await client.end();
    }
  }
});

// Route: /api/messages
app.get('/api/messages', async (req, res) => {
  const { chatId } = req.query;
  console.log(`Fetching messages for chat: ${chatId}`);

  if (!chatId) return res.status(400).json({ error: 'Chat ID is required' });

  let client;
  try {
    client = getClient();
    await client.connect();
    const { rows } = await client.sql`
      SELECT * FROM messages 
      WHERE chat_id = ${chatId} 
      ORDER BY created_at ASC;
    `;
    console.log(`Found ${rows.length} messages`);
    res.json({ messages: rows });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  } finally {
    if (client) await client.end();
  }
});

app.post('/api/messages', async (req, res) => {
  const { chatId } = req.query;
  const { content, senderId } = req.body;
  console.log(`Posting message to chat: ${chatId}, sender: ${senderId}`);

  if (!chatId || !content || !senderId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let client;
  try {
    client = getClient();
    await client.connect();
    const { rows } = await client.sql`
      INSERT INTO messages (content, sender_id, chat_id)
      VALUES (${content}, ${senderId}, ${chatId})
      RETURNING *;
    `;
    console.log("Message inserted:", rows[0]);
    res.json({ message: rows[0] });
  } catch (error) {
    console.error("Post message error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  } finally {
    if (client) await client.end();
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled application error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    stack: err.stack
  });
});

// Export for Vercel (ESM)
export default app;
