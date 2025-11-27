import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure upload directories exist
const imageDir = path.resolve('public', 'uploads', 'images');
const voiceDir = path.resolve('public', 'uploads', 'voice');
[imageDir, voiceDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Multer storage configuration – store files in appropriate subfolders based on mimetype
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, imageDir);
        } else if (file.mimetype.startsWith('audio/')) {
            cb(null, voiceDir);
        } else {
            cb(new Error('Unsupported file type'), null);
        }
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '_' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    },
});

const upload = multer({ storage });

// Simple token validation – reuse same logic as other routes
function validateToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId, timestamp] = decoded.split(':');
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(timestamp) > thirtyDays) return null;
        return userId;
    } catch {
        return null;
    }
}

router.post('/', upload.single('file'), (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权' });
    }
    const token = authHeader.substring(7);
    const userId = validateToken(token);
    if (!userId) {
        return res.status(401).json({ error: '无效token' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Build public URL – assuming static serving of /public
    const relativePath = path.relative(path.resolve('public'), req.file.path).replace(/\\/g, '/');
    const url = `/${relativePath}`; // e.g., /uploads/images/12345.png

    // Optionally store reference in DB (skipped for brevity)

    res.status(200).json({ url });
});

export default router;
