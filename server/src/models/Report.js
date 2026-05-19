import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reportType: {
            type: String,
            required: true,
            trim: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            default: null,
        },
        status: {
            type: String,
            default: 'pending',
        },
        reason: {
            type: String,
            default: '',
        },
        detail: {
            type: String,
            default: '',
        },
        decision: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        decisionReason: {
            type: String,
            default: '',
        },
        decisionDate: {
            type: Date,
            default: null,
        },
        decidedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        banDays: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Report = mongoose.model('Report', reportSchema);

export default Report;