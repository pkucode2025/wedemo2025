import express from 'express';
import pg from 'pg';

const { Pool } = pg;

console.log("Initializing API with standard pg driver...");

const app = express();
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Create a connection pool
// We use a pool because it's better for serverless environments to manage connections
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false // Required for Vercel Postgres (Neon)
  }
});

// Helper to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    driver: 'pg',
    env: {
      HAS_POSTGRES_URL: !!process.env.POSTGRES_URL
    }
  });
});

// Setup route
app.get('/api/setup', async (req, res) => {
  try {
    console.log("Creating messages table...");
    const result = await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    res.json({ message: "Database initialized successfully", result });
  } catch (error) {
    console.error("Setup failed:", error);
    res.status(500).json({ error: "Setup failed", details: error.message });
  }
});

// Get messages
app.get('/api/messages', async (req, res) => {
  const { chatId } = req.query;
  if (!chatId) return res.status(400).json({ error: 'Chat ID is required' });

  try {
    const { rows } = await query(
      'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
      [chatId]
    );
    res.json({ messages: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post message
app.post('/api/messages', async (req, res) => {
  const { chatId } = req.query;
  const { content, senderId } = req.body;

  if (!chatId || !content || !senderId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { rows } = await query(
      'INSERT INTO messages (content, sender_id, chat_id) VALUES ($1, $2, $3) RETURNING *',
      [content, senderId, chatId]
    );
    res.json({ message: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
