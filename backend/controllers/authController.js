import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide username, email, and password.' });
        }

        const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingEmail) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        const existingUsername = await User.findOne({ username: username.trim() });
        if (existingUsername) {
            return res.status(400).json({ message: 'That username is already taken.' });
        }

        const user = await User.create({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password,
        });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            displayName: user.displayName || '',
            bio: user.bio || '',
            statusMessage: user.statusMessage || '',
            role: user.role || 'user',
            isBanned: user.isBanned || false,
            token: generateToken(user._id),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const authUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password.' });
        }

        // First: check if account exists
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(401).json({ message: 'Account does not exist. Please register first.' });
        }

        // Second: check password separately
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        // Third: check if banned
        if (user.isBanned) {
            return res.status(403).json({ message: 'Your account has been banned. Please contact support.' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            displayName: user.displayName || '',
            bio: user.bio || '',
            statusMessage: user.statusMessage || '',
            role: user.role,
            isBanned: user.isBanned,
            token: generateToken(user._id),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user profile
// @route   GET /api/auth/me
export const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            displayName: user.displayName || '',
            bio: user.bio || '',
            statusMessage: user.statusMessage || '',
            role: user.role || 'user',
            isBanned: user.isBanned || false,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users
// @route   GET /api/auth/users
export const getAllUsers = async (req, res, next) => {
    try {
        const keyword = req.query.search
            ? {
                $or: [
                    { username: { $regex: req.query.search, $options: 'i' } },
                    { email: { $regex: req.query.search, $options: 'i' } },
                ],
            }
            : {};

        const users = await User.find({
            ...keyword,
            _id: { $ne: req.user._id },
            role: { $ne: 'admin' }
        }).select('-password');
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile (username, avatar, bio, statusMessage, displayName)
// @route   PUT /api/auth/profile
export const updateUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (req.body.username) user.username = req.body.username.trim();
        if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
        if (req.body.displayName !== undefined) user.displayName = req.body.displayName.trim();
        if (req.body.bio !== undefined) user.bio = req.body.bio.trim().slice(0, 160);
        if (req.body.statusMessage !== undefined) user.statusMessage = req.body.statusMessage.trim().slice(0, 80);

        const updated = await user.save();
        res.json({
            _id: updated._id,
            username: updated.username,
            email: updated.email,
            avatar: updated.avatar,
            displayName: updated.displayName || '',
            bio: updated.bio || '',
            statusMessage: updated.statusMessage || '',
        });
    } catch (error) {
        next(error);
    }
};
