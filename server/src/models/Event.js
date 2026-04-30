import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        eventDate: {
            type: Date,
            required: true,
        },
        startTime: {
            type: String,
            default: '',
        },
        endTime: {
            type: String,
            default: '',
        },
        location: {
            type: String,
            default: '',
        },
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        detail: {
            type: String,
            default: '',
        },
        imageURL: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            default: 'active',
        },
    },
    {
        timestamps: true,
    }
);

const Event = mongoose.model('Event', eventSchema);

export default Event;