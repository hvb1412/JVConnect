import dotenv from 'dotenv';
// Load config ngay dòng đầu tiên để các file import sau nhận được biến môi trường
dotenv.config({ path: '.env' }); 

import app from './app.js'; // Nhớ đuôi .js
import connectDB from './configs/db.js'; // Nhớ đuôi .js

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`[Server] Đang chạy tại http://localhost:${PORT}`);
    });
});