import axios from "axios";
import { BackendUser, mapBackendUserToUi, UiUser } from "./userApi";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
});

export type AuthResponse = {
    success: boolean;
    data: {
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

export async function registerUser(name: string, email: string, password: string): Promise<{ user: UiUser, token: string }> {
    try {
        const response = await api.post<AuthResponse>("/auth/register", { name, email, password });
        if (response.data.success && response.data.data) {
            return {
                user: mapBackendUserToUi(response.data.data.user),
                token: response.data.data.token
            };
        }
        throw new Error(response.data.message || "Đăng ký thất bại");
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
