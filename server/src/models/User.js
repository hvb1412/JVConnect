import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        confirmCode: {
            type: String,
            default: null,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        avatarURL: {
            type: String,
            default: '',
        },
        area: {
            type: String,
            default: '',
        },
        occupation: {
            type: String,
            default: '',
        },
        introduction: {
            type: String,
            default: '',
        },
        latestBanDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);

export default User;