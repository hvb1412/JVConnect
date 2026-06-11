import express from 'express';
import cors from 'cors';
import routes from './routes/index.route.js'; 
import errorHandler from './middlewares/error.middleware.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

if (!globalThis.crypto) {
  globalThis.crypto = crypto.webcrypto;
}


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
    optionsSuccessStatus: 200,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', routes);

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get(/^\/(?!api).*/, (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  console.warn(`[Server] Không tìm thấy client dist tại ${clientDistPath}. Nếu muốn deploy frontend cùng backend, hãy build client trước khi khởi chạy server.`);
  app.get('/', (req, res) => {
    res.send('JVConnect backend is running. Frontend static files not found.');
  });
}

app.use((req, res, next) => {
    const error = new Error(`Không tìm thấy - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

app.use(errorHandler);

export default app;