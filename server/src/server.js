import dotenv from 'dotenv';
dotenv.config({ path: '.env' }); 

import app from './app.js'; 
import connectDB from './configs/db.js';

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`[Server] Đang chạy tại http://localhost:${PORT}`);
    });
});