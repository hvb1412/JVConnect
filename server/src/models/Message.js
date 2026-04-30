import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },
        sendTime: {
            type: String,
            default: '',
        },
        sendDate: {
            type: Date,
            default: Date.now,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        seenStatus: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;