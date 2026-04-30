import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
    {
        user1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        user2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({ user1: 1, user2: 1 }, { unique: true });

conversationSchema.pre('validate', function normalizeConversationPair() {
    if (this.user1 && this.user2) {
        const user1Value = String(this.user1);
        const user2Value = String(this.user2);

        if (user1Value > user2Value) {
            [this.user1, this.user2] = [this.user2, this.user1];
        }
    }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;