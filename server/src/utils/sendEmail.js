import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.BREVO_LOGIN || process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Send an email using Brevo SMTP
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body content
 */
export const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"${process.env.BREVO_SENDER_NAME || 'JVConnect'}" <${process.env.BREVO_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email: ', error);
        return { success: false, error };
    }
};

/**
 * HTML Template for OTP Email
 */
export const getOtpEmailTemplate = (name, otp, purpose = 'Đăng ký tài khoản') => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fafafa;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #2563eb; margin: 0;">JVConnect</h2>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h3 style="color: #333333; margin-top: 0;">Xin chào ${name},</h3>
            <p style="color: #555555; font-size: 16px; line-height: 1.5;">
                Bạn đã yêu cầu mã xác thực cho: <strong>${purpose}</strong>.
            </p>
            <p style="color: #555555; font-size: 16px; line-height: 1.5;">
                Dưới đây là mã xác thực (OTP) của bạn. Mã này sẽ hết hạn sau <strong>10 phút</strong>.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="display: inline-block; padding: 15px 30px; font-size: 28px; font-weight: bold; color: #ffffff; background-color: #2563eb; border-radius: 8px; letter-spacing: 5px;">
                    ${otp}
                </span>
            </div>
            <p style="color: #777777; font-size: 14px; line-height: 1.5;">
                Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.
            </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999999; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} JVConnect. All rights reserved.</p>
        </div>
    </div>
    `;
};
