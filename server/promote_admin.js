import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function promote() {
    const client = await pool.connect();
    try {
        console.log('Promoting all users to admin for testing...');
        await client.query('UPDATE users SET is_admin = TRUE');
        console.log('Success! All users are now admins.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.release();
        pool.end();
    }
}

promote();
