import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
        // e.g. 'USER_DELETED', 'USER_BANNED', 'USER_UNBANNED', 'MESSAGE_DELETED', 'FILE_DELETED', 'USER_BROADCAST', 'PASSWORD_RESET'
    },
    detail: {
        type: String,
        default: ''
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    targetId: {
        type: String, // can be user _id, message _id, etc.
        default: null
    },
    targetType: {
        type: String, // 'user', 'message', 'file'
        default: null
    }
}, { timestamps: true });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
