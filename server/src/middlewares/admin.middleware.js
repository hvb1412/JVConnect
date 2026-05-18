const adminMiddleware = (req, res, next) => {
    const role = req.user?.role;
    const email = String(req.user?.email || '').toLowerCase();

    if (role !== 'admin' && email !== 'admin@jvconnect.com') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden',
        });
    }

    next();
};

export default adminMiddleware;
