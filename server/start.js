import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local FIRST
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Dynamically import app AFTER env vars are loaded
const { default: app } = await import('./index.js');

const PORT = process.env.PORT || 3001;

// Listen on 0.0.0.0 to support both IPv4 and IPv6 clients
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    if (process.env.POSTGRES_URL === 'postgres://user:password@host:port/database') {
        console.error('❌ ERROR: You are using the placeholder database URL. Please update .env.local with your real PostgreSQL connection string.');
    } else {
        console.log(`Database URL: ${process.env.POSTGRES_URL ? 'Loaded' : 'Missing'}`);
    }
});
