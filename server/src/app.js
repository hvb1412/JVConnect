import express from 'express';
import cors from 'cors';
import routes from './routes/index.route.js'; 
import errorHandler from './middlewares/error.middleware.js'; 

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use((req, res, next) => {
    const error = new Error(`Không tìm thấy - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

app.use(errorHandler);

export default app;