/**
 * One-time script to create the admin user in MongoDB.
 * Run with: node --experimental-vm-modules scripts/createAdmin.js
 * Or:       node scripts/createAdmin.js  (if experimental modules enabled)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/antigravity-chat';

// Inline schema to avoid circular imports
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    avatar: { type: String, default: '' },
    displayName: { type: String, default: '' },
    bio: { type: String, default: '' },
    statusMessage: { type: String, default: '' },
    role: { type: String, default: 'user' },
    isBanned: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const ADMIN_EMAIL = 'mrp@gmail.com';
const ADMIN_PASSWORD = '243601';
const ADMIN_USERNAME = 'Admin';

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
        // Always ensure role is admin
        existing.role = 'admin';
        existing.isBanned = false;
        const salt = await bcrypt.genSalt(10);
        existing.password = await bcrypt.hash(ADMIN_PASSWORD, salt);
        await existing.save();
        console.log(`✅ Admin user updated: ${ADMIN_EMAIL}`);
    } else {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(ADMIN_PASSWORD, salt);
        await User.create({
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            password: hashed,
            role: 'admin',
        });
        console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
    }

    await mongoose.disconnect();
    console.log('Done. You can now login as admin at the /login page.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
