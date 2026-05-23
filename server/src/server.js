import dotenv from 'dotenv';
dotenv.config(); 

import { createServer } from 'http';
import { initSocket } from './socket.js';
import app from './app.js'; 
import connectDB from './configs/db.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

connectDB().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`[Server] Đang chạy tại http://localhost:${PORT}`);
    });
});