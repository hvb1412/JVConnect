import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/configs/db.js';

connectDB().catch((error) => {
  console.error('[Server] MongoDB connection failed:', error);
});

export default app;
