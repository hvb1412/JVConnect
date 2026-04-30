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
    },
    {
        timestamps: true,
    }
);

participationSchema.index({ user: 1, event: 1 }, { unique: true });

const Participation = mongoose.model('Participation', participationSchema);

export default Participation;