export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { password } = req.body;

    if (!process.env.ADMIN_PASSWORD) {
        console.error('ADMIN_PASSWORD not set in environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (password === process.env.ADMIN_PASSWORD) {
        // In a real app, use a proper JWT signed with a secret
        // For this standalone admin, a static secret token is sufficient for the requirement
        return res.status(200).json({ token: 'admin-secret-token-888' });
    } else {
        return res.status(401).json({ error: 'Invalid password' });
    }
}
