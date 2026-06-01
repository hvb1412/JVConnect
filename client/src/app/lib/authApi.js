import axios from "axios";
import { mapBackendUserToUi } from "./userApi";
import { API_ENDPOINT } from "./config";
const api = axios.create({
    baseURL: API_ENDPOINT,
});
export async function loginUser(email, password) {
    try {
        const response = await api.post("/auth/login", { email, password });
        if (response.data.success && response.data.data) {
            const backendUser = response.data.data.user;
            // persist preferred language from backend
            try {
                if (backendUser.language)
                    localStorage.setItem('jvconnect-lang', backendUser.language);
            }
            catch { }
            return {
                user: mapBackendUserToUi(backendUser),
                token: response.data.data.token,
                role: backendUser.role || "user",
            };
        }
        throw new Error(response.data.message || "Đăng nhập thất bại");
    }
    catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Lỗi kết nối đến máy chủ");
    }
}
// Update registerUser to just return a message (OTP sent)
export async function registerUser(name, email, password, avatarURL, language) {
    try {
        const response = await api.post("/auth/register", {
            name,
            email,
            password,
            avatarURL,
            language,
        });
        if (response.data.success) {
            return { message: response.data.message || "Mã xác thực đã được gửi." };
        }
        throw new Error(response.data.message || "Đăng ký thất bại");
    }
    catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Lỗi kết nối đến máy chủ");
    }
}
export async function verifyEmail(email, otp) {
    try {
        const response = await api.post("/auth/verify-email", { email, otp });
        if (response.data.success && response.data.data) {
            const backendUser = response.data.data.user;
            try {
                if (backendUser.language)
                    localStorage.setItem('jvconnect-lang', backendUser.language);
            }
            catch { }
            return {
                user: mapBackendUserToUi(backendUser),
                token: response.data.data.token,
                role: backendUser.role || "user",
            };
        }
        throw new Error(response.data.message || "Xác thực thất bại");
    }
    catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Lỗi kết nối đến máy chủ");
    }
}
export async function resendOtp(email) {
    try {
        const response = await api.post("/auth/resend-otp", { email });
        if (response.data.success) {
            return { message: response.data.message };
        }
        throw new Error(response.data.message || "Gửi lại OTP thất bại");
    }
    catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Lỗi kết nối đến máy chủ");
    }
}
export async function forgotPassword(email) {
    try {
        const response = await api.post("/auth/forgot-password", { email });
        if (response.data.success) {
            return { message: response.data.message };
        }
        throw new Error(response.data.message || "Gửi yêu cầu thất bại");
    }
    catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Lỗi kết nối đến máy chủ");
    }
}
export async function verifyForgotPasswordOtp(email, otp) {
    try {
        const response = await api.post("/auth/verify-forgot-password-otp", { email, otp });
        if (response.data.success && response.data.data) {
            return { resetToken: response.data.data.resetToken };
        }
        throw new Error(response.data.message || "Xác thực OTP thất bại");
    }
    catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Lỗi kết nối đến máy chủ");
    }
}
export async function resetPassword(resetToken, newPassword) {
    try {
        const response = await api.post("/auth/reset-password", { resetToken, newPassword });
        if (response.data.success) {
            return { message: response.data.message };
        }
        throw new Error(response.data.message || "Đổi mật khẩu thất bại");
    }
    catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Lỗi kết nối đến máy chủ");
    }
}
export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
}
