import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail, getOtpEmailTemplate } from '../utils/sendEmail.js';

// JWT_SECRET is accessed via process.env inside functions

/** Helper: Generate 6-digit OTP */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/** Kiểm tra user có đang bị ban không (tính theo restrictedUntil) */
const isUserBanned = (user) => {
    if (!user.isRestricted) return false;
    // Permanent ban (restrictedUntil = null + isRestricted = true)
    if (!user.restrictedUntil) return true;
    // Temporary ban: check if still active
    return new Date(user.restrictedUntil) > new Date();
};

export const register = async (req, res) => {
    try {
        const { email, password, name, avatarURL } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedEmail || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ email, mật khẩu và tên',
            });
        }

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        let user = await User.findOne({ email: normalizedEmail });
        
        if (user) {
            if (user.isVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng và đã xác thực',
                });
            } else {
                // If user exists but not verified, update their info and new OTP
                user.password = password; // will be hashed in pre-save hook
                user.name = name;
                user.avatarURL = avatarURL || '';
                user.otp = otp;
                user.otpExpires = otpExpires;
                await user.save();
            }
        } else {
            // New user
            user = new User({
                email: normalizedEmail,
                password,
                name,
                avatarURL: avatarURL || '',
                needsProfileUpdate: true,
                role: 'user',
                isVerified: false,
                otp,
                otpExpires
            });
            await user.save();
        }

        // Send OTP via email
        const html = getOtpEmailTemplate(name, otp, 'Xác thực tài khoản Đăng ký');
        await sendEmail(normalizedEmail, 'Mã xác thực tài khoản JVConnect', html);

        return res.status(201).json({
            success: true,
            message: 'Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
        });
    } catch (error) {
        console.error('Lỗi khi đăng ký:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký' });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedEmail || !otp) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mã OTP' });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Tài khoản đã được xác thực trước đó' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Mã OTP không chính xác' });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn' });
        }

        // OTP Valid
        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'jvconnect_secret_key_123456',
            { expiresIn: '7d' }
        );

        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;
        delete userWithoutPassword.otp;
        delete userWithoutPassword.otpExpires;

        return res.status(200).json({
            success: true,
            message: 'Xác thực email thành công',
            data: { user: userWithoutPassword, token },
        });

    } catch (error) {
        console.error('Lỗi khi xác thực email:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xác thực email' });
    }
};

export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedEmail) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email' });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Tài khoản đã được xác thực trước đó' });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const html = getOtpEmailTemplate(user.name, otp, 'Gửi lại mã Xác thực tài khoản');
        await sendEmail(normalizedEmail, 'Mã xác thực tài khoản JVConnect mới', html);

        return res.status(200).json({
            success: true,
            message: 'Mã xác thực mới đã được gửi.',
        });
    } catch (error) {
        console.error('Lỗi khi gửi lại OTP:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi gửi lại mã OTP' });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedEmail) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email' });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng với email này' });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const html = getOtpEmailTemplate(user.name, otp, 'Khôi phục mật khẩu');
        await sendEmail(normalizedEmail, 'Mã xác thực Khôi phục mật khẩu JVConnect', html);

        return res.status(200).json({
            success: true,
            message: 'Mã khôi phục đã được gửi vào email của bạn.',
        });
    } catch (error) {
        console.error('Lỗi forgot password:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

export const verifyForgotPasswordOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedEmail || !otp) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mã OTP' });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Mã OTP không chính xác' });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn' });
        }

        // OTP is correct, we clear the OTP and provide a short-lived reset token (valid for 15 mins)
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        const resetToken = jwt.sign(
            { id: user._id, type: 'password_reset' },
            process.env.JWT_SECRET || 'jvconnect_secret_key_123456',
            { expiresIn: '15m' }
        );

        return res.status(200).json({
            success: true,
            message: 'Xác thực OTP thành công',
            data: { resetToken },
        });
    } catch (error) {
        console.error('Lỗi verify forgot password OTP:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp token và mật khẩu mới' });
        }

        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'jvconnect_secret_key_123456');
        if (decoded.type !== 'password_reset') {
            return res.status(400).json({ success: false, message: 'Token không hợp lệ' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        // Mongoose pre-save hook will hash the password
        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
        });
    } catch (error) {
        console.error('Lỗi reset password:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ success: false, message: 'Token đã hết hạn, vui lòng thao tác lại' });
        }
        return res.status(500).json({ success: false, message: 'Lỗi server hoặc token không hợp lệ' });
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

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        }

        // Check if verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản chưa được xác thực email',
                data: { isVerified: false, email: user.email }
            });
        }

        // Kiểm tra ban — dùng restrictedUntil thay vì latestBanDate
        if (isUserBanned(user)) {
            return res.status(403).json({
                success: false,
                message: 'アカウントが制限されています',
                data: {
                    isRestricted: true,
                    restrictedUntil: user.restrictedUntil,
                    latestBanDate: user.latestBanDate,
                },
            });
        }

        // Tự động bỏ ban nếu hết hạn (restrictedUntil đã qua)
        if (user.isRestricted && user.restrictedUntil && new Date(user.restrictedUntil) <= new Date()) {
            user.isRestricted = false;
            user.restrictedUntil = null;
            await user.save();
        }

        const resolvedRole = user.role || (user.email === 'admin@jvconnect.com' ? 'admin' : 'user');

        const token = jwt.sign(
            { id: user._id, email: user.email, role: resolvedRole },
            process.env.JWT_SECRET || 'jvconnect_secret_key_123456',
            { expiresIn: '7d' }
        );

        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;
        delete userWithoutPassword.otp;
        delete userWithoutPassword.otpExpires;

        return res.status(200).json({
            success: true,
            data: { user: { ...userWithoutPassword, role: resolvedRole }, token },
        });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập' });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Tự động bỏ ban nếu hết hạn
        if (user.isRestricted && user.restrictedUntil && new Date(user.restrictedUntil) <= new Date()) {
            user.isRestricted = false;
            user.restrictedUntil = null;
            await user.save();
        }

        return res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isRestricted: user.isRestricted,
                restrictedUntil: user.restrictedUntil,
                latestBanDate: user.latestBanDate,
                needsProfileUpdate: user.needsProfileUpdate,
                isVerified: user.isVerified,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
