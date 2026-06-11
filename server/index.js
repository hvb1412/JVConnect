import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/configs/db.js';

connectDB().catch((error) => {
  console.error('[Server] MongoDB connection failed:', error);
});

// Export `app` so serverless platforms (e.g. Vercel) can import it.
export default app;

// If this file is executed directly (e.g. `node index.js` on Render),
// import the real server starter which creates the HTTP server and listens on
// the platform-provided PORT. This ensures platforms that expect an open port
// (Render, Heroku, etc.) detect the service as healthy.
if (
  process.argv[1] &&
  (process.argv[1].endsWith('index.js') || process.argv[1].endsWith('\\index.js') || process.env.START_SERVER === 'true')
) {
  import('./src/server.js')
    .then(() => {
      console.log('[Server] Starter imported; server should be listening.');
    })
    .catch((err) => {
      console.error('[Server] Failed to start server:', err);
      process.exit(1);
    });
}
