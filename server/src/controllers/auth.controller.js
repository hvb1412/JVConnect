import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    try {
        const { email, password, name, avatarURL } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const normalizedRole = 'user';

        if (!normalizedEmail || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ email, mật khẩu và tên',
            });
        }

        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng',
            });
        }

        // Tạo user mới
        const newUser = new User({
            email: normalizedEmail,
            password: password,
            name,
            avatarURL: avatarURL || '',
            needsProfileUpdate: true,
            role: normalizedRole,
        });

        await newUser.save();

        // Tạo JWT token
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET || 'jvconnect_secret_key_123456',
            { expiresIn: '7d' }
        );

        // Loại bỏ password trước khi trả về
        const userWithoutPassword = newUser.toObject();
        delete userWithoutPassword.password;

        return res.status(201).json({
            success: true,
            data: {
                user: userWithoutPassword,
                token,
            },
        });
    } catch (error) {
        console.error('Lỗi khi đăng ký:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký',
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp email và mật khẩu',
            });
        }

        // Tìm user theo email
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
        }

        // Kiểm tra xem tài khoản có bị khóa không (tùy chọn theo latestBanDate)
        if (user.latestBanDate && new Date(user.latestBanDate) > new Date()) {
             return res.status(403).json({
                success: false,
                message: 'Tài khoản của bạn đã bị khóa',
             });
        }

        // Tạo JWT token
        const resolvedRole = user.role || (user.email === 'admin@jvconnect.com' ? 'admin' : 'user');

        const token = jwt.sign(
            { id: user._id, email: user.email, role: resolvedRole },
            process.env.JWT_SECRET || 'jvconnect_secret_key_123456',
            { expiresIn: '7d' }
        );

        // Loại bỏ password trước khi trả về
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        return res.status(200).json({
            success: true,
            data: {
                user: { ...userWithoutPassword, role: resolvedRole },
                token,
            },
        });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập',
        });
    }
};
