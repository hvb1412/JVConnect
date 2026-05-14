import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    try {
        const { email, password, name, avatarURL } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ email, mật khẩu và tên',
            });
        }

        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng',
            });
        }

        // Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới
        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            avatarURL: avatarURL || '',
        });

        await newUser.save();

        // Tạo JWT token
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
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

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp email và mật khẩu',
            });
        }

        // Tìm user theo email
        const user = await User.findOne({ email });
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
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Loại bỏ password trước khi trả về
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        return res.status(200).json({
            success: true,
            data: {
                user: userWithoutPassword,
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
