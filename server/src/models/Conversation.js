import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
    {
        // 'direct' = chat 1-1, 'group' = group chat
        type: {
            type: String,
            enum: ['direct', 'group'],
            default: 'direct',
        },

        // ── Direct chat fields ────────────────────────────────────────────────
        user1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        user2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        // 'pending' = message request chưa được chấp nhận
        // 'accepted' = cuộc trò chuyện bình thường
        status: {
            type: String,
            enum: ['pending', 'accepted'],
            default: 'accepted',
        },
        // Người khởi tạo conversation (người gửi message request)
        initiator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        // ── Group chat fields ─────────────────────────────────────────────────
        name: {
            type: String,
            trim: true,
            default: '',
        },
        avatarURL: {
            type: String,
            default: '',
        },
        // Thành viên nhóm (dùng cho group chat)
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        // Admin của nhóm (người tạo nhóm)
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        // Liên kết tới sự kiện (nếu group chat được tạo từ sự kiện)
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index unique cho direct chat (user1 < user2 alphabetically)
conversationSchema.index(
    { user1: 1, user2: 1 },
    { unique: true, sparse: true, partialFilterExpression: { type: 'direct' } }
);

// Normalize user1/user2 thứ tự cho direct chat
conversationSchema.pre('validate', function normalizeConversationPair() {
    if (this.type === 'direct' && this.user1 && this.user2) {
        const user1Value = String(this.user1);
        const user2Value = String(this.user2);

        if (user1Value > user2Value) {
            [this.user1, this.user2] = [this.user2, this.user1];
        }
    }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;