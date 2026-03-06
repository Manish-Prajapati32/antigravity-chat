import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({ email: String });
const User = mongoose.model('User', userSchema);

async function main() {
    await mongoose.connect(MONGODB_URI);
    const result = await User.deleteOne({ email: 'mrp@gmail.com' });
    if (result.deletedCount > 0) {
        console.log('✅ Successfully removed user mrp@gmail.com');
    } else {
        console.log('❌ User mrp@gmail.com not found in the database');
    }
    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
