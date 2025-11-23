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

export default async function handler(req, res) {
  const { force } = req.query;
  console.log(`[/api/setup] Request received, force=${force}`);

  const client = await pool.connect();
  try {
    console.log('[/api/setup] Creating tables...');

    // 1. Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add is_recalled column if not exists
    try {
      await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_recalled BOOLEAN DEFAULT FALSE`);
    } catch (e) {
      console.log('Column is_recalled might already exist');
    }

    console.log('[/api/setup] Messages table ready');

    // 2. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        avatar_url TEXT DEFAULT 'https://picsum.photos/id/64/200/200',
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[/api/setup] Users table ready');

    // 3. Friendships table
    await client.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        friend_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id)
      );
    `);
    console.log('[/api/setup] Friendships table ready');

    // 4. Friend Requests table (New)
    await client.query(`
      CREATE TABLE IF NOT EXISTS friend_requests (
        id SERIAL PRIMARY KEY,
        from_user_id VARCHAR(50) NOT NULL,
        to_user_id VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
        message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(from_user_id, to_user_id)
      );
    `);
    console.log('[/api/setup] Friend Requests table ready');

    // 5. Chat read status table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_read_status (
        id SERIAL PRIMARY KEY,
        chat_id TEXT NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chat_id, user_id)
      );
    `);

    // 6. Chat Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_settings (
        id SERIAL PRIMARY KEY,
        chat_id TEXT NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        is_muted BOOLEAN DEFAULT FALSE,
        is_sticky BOOLEAN DEFAULT FALSE,
        UNIQUE(chat_id, user_id)
      );
    `);

    // 7. Moments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS moments (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        content TEXT,
        images JSONB DEFAULT '[]',
        likes JSONB DEFAULT '[]',
        comments JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[/api/setup] All tables ready');

    // Force reset if requested
    if (force === 'true') {
      console.log('[/api/setup] Force flag detected, clearing all messages...');
      await client.query('DELETE FROM messages');
      await client.query('DELETE FROM chat_read_status');
      // await client.query('DELETE FROM friend_requests');
    }

    res.status(200).json({
      success: true,
      message: "Database initialized successfully"
    });
  } catch (error) {
    console.error('[/api/setup] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
}
