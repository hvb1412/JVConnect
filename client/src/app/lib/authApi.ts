import axios from "axios";
import { BackendUser, mapBackendUserToUi, UiUser } from "./userApi";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
});

export type AuthResponse = {
    success: boolean;
    data?: {
        user: BackendUser;
        token: string;
    };
    message?: string;
};

export async function loginUser(email: string, password: string): Promise<{ user: UiUser, token: string, role: string }> {
    try {
        const response = await api.post<AuthResponse>("/auth/login", { email, password });
        if (response.data.success && response.data.data) {
            const backendUser = response.data.data.user;
            return {
                user: mapBackendUserToUi(backendUser),
                token: response.data.data.token,
                role: backendUser.role || "user",
            };
        }
        throw new Error(response.data.message || "Đăng nhập thất bại");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Lỗi kết nối đến máy chủ");
    }
}

// Update registerUser to just return a message (OTP sent)
export async function registerUser(
    name: string,
    email: string,
    password: string,
    avatarURL?: string,
): Promise<{ message: string }> {
    try {
        const response = await api.post<AuthResponse>("/auth/register", {
            name,
            email,
            password,
            avatarURL,
        });
        if (response.data.success) {
            return { message: response.data.message || "Mã xác thực đã được gửi." };
        }
        throw new Error(response.data.message || "Đăng ký thất bại");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Lỗi kết nối đến máy chủ");
    }
}

export async function verifyEmail(email: string, otp: string): Promise<{ user: UiUser, token: string, role: string }> {
    try {
        const response = await api.post<AuthResponse>("/auth/verify-email", { email, otp });
        if (response.data.success && response.data.data) {
            const backendUser = response.data.data.user;
            return {
                user: mapBackendUserToUi(backendUser),
                token: response.data.data.token,
                role: backendUser.role || "user",
            };
        }
        throw new Error(response.data.message || "Xác thực thất bại");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Lỗi kết nối đến máy chủ");
    }
}

export async function resendOtp(email: string): Promise<{ message: string }> {
    try {
        const response = await api.post<{ success: boolean; message: string }>("/auth/resend-otp", { email });
        if (response.data.success) {
            return { message: response.data.message };
        }
        throw new Error(response.data.message || "Gửi lại OTP thất bại");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Lỗi kết nối đến máy chủ");
    }
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
    try {
        const response = await api.post<{ success: boolean; message: string }>("/auth/forgot-password", { email });
        if (response.data.success) {
            return { message: response.data.message };
        }
        throw new Error(response.data.message || "Gửi yêu cầu thất bại");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Lỗi kết nối đến máy chủ");
    }
}

export async function verifyForgotPasswordOtp(email: string, otp: string): Promise<{ resetToken: string }> {
    try {
        const response = await api.post<{ success: boolean; data: { resetToken: string }, message?: string }>("/auth/verify-forgot-password-otp", { email, otp });
        if (response.data.success && response.data.data) {
            return { resetToken: response.data.data.resetToken };
        }
        throw new Error(response.data.message || "Xác thực OTP thất bại");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("Lỗi kết nối đến máy chủ");
    }
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<{ message: string }> {
    try {
        const response = await api.post<{ success: boolean; message: string }>("/auth/reset-password", { resetToken, newPassword });
        if (response.data.success) {
            return { message: response.data.message };
        }
        throw new Error(response.data.message || "Đổi mật khẩu thất bại");
    } catch (error: any) {
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
