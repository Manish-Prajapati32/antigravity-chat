import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware: verifies JWT token AND checks user is admin.
 * Attaches req.user on success.
 */
export const adminProtect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Not authorized, no token.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found.' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required.' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Not authorized, invalid token.' });
    }
};
