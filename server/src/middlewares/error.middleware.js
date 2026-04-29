const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    console.error(`[Lỗi]: ${err.message}`);
    res.status(statusCode).json({
        success: false,
        message: err.message
    });
};

export default errorHandler;