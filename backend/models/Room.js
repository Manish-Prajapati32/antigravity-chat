import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);
export default Room;
