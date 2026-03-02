import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

// Prevent duplicate pending invitations between the same users
invitationSchema.index({ sender: 1, receiver: 1, status: 1 });

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
