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

        // ── Read tracking for group chat ──────────────────────────────────────
        // Danh sách userId đã đọc tin nhắn (dùng cho group chat)
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],

        // ── Pin feature ───────────────────────────────────────────────────────
        isPinned: {
            type: Boolean,
            default: false,
        },
        pinnedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        pinnedAt: {
            type: Date,
            default: null,
        },

        // ── Recall feature ────────────────────────────────────────────────────
        // Khi isRecalled = true, content vẫn lưu DB nhưng client hiển thị
        // "Tin nhắn đã được thu hồi" / "メッセージが取り消されました"
        isRecalled: {
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