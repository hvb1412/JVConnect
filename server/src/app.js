import express from 'express';
import cors from 'cors';
import routes from './routes/index.route.js'; 
import errorHandler from './middlewares/error.middleware.js';
import crypto from 'crypto';

if (!globalThis.crypto) {
  globalThis.crypto = crypto.webcrypto;
}


const app = express();

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

app.use((req, res, next) => {
    const error = new Error(`Không tìm thấy - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

app.use(errorHandler);

export default app;