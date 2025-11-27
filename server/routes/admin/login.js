const FALLBACK_ADMIN_PASSWORD = 'admin888';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { password } = req.body;

    const configuredPassword = process.env.ADMIN_PASSWORD;
    const effectivePassword = configuredPassword || FALLBACK_ADMIN_PASSWORD;

    if (!configuredPassword) {
        console.warn(
            `ADMIN_PASSWORD not set, using fallback admin password "${FALLBACK_ADMIN_PASSWORD}". ` +
            'For production, please set ADMIN_PASSWORD in environment variables.'
        );
    }

    if (password === effectivePassword) {
        // In a real app, use a proper JWT signed with a secret
        // For this standalone admin, a static secret token is sufficient for the requirement
        return res.status(200).json({ token: 'admin-secret-token-888' });
    } else {
        return res.status(401).json({ error: 'Invalid password' });
    }
}
