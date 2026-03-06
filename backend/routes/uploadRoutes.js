import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${uniqueSuffix}-${sanitizedName}`);
    }
});

function checkFileType(file, cb) {
    // Allowed extensions — includes webm/ogg/m4a for voice recordings
    const filetypes = /jpeg|jpg|png|gif|mp4|webm|mp3|wav|ogg|m4a|aac|pdf|docx|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    // Allow by MIME type — audio/webm is the MediaRecorder default on Chrome/Firefox
    const allowedMimes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm',
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm',
        'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mp4',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];
    const mimeOk = allowedMimes.includes(file.mimetype);

    if (extname || mimeOk) {
        return cb(null, true);
    } else {
        cb(new Error('File format not supported!'));
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// @desc    Upload a file
// @route   POST /api/upload
router.post('/', protect, (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Multer Error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        // Determine type for frontend renderer
        let fileType = 'document';
        const mime = req.file.mimetype;
        if (mime.startsWith('image/')) fileType = 'image';
        else if (mime.startsWith('video/')) fileType = 'video';
        else if (mime.startsWith('audio/')) fileType = 'audio';

        res.status(201).json({
            fileUrl: `/uploads/${req.file.filename}`,
            fileType,
            fileName: req.file.originalname
        });
    });
});

export default router;
