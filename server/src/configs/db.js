import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`[MongoDB] Đã kết nối: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[MongoDB] Lỗi: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;