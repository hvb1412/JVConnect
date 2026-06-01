import mongoose from 'mongoose';

const participationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
        },
        // 'pending'  = chờ admin duyệt
        // 'approved' = đã được duyệt, tính là tham gia chính thức
        // 'rejected' = bị từ chối
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        // Admin đã duyệt/từ chối
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

participationSchema.index({ user: 1, event: 1 }, { unique: true });

const Participation = mongoose.model('Participation', participationSchema);

export default Participation;