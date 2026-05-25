import axios from "axios";
import { API_ENDPOINT } from "./config";

const api = axios.create({
    baseURL: API_ENDPOINT,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Types
export type AdminStats = {
    totalUsers: number;
    totalAdmins: number;
    totalEvents: number;
    activeEvents: number;
    totalReports: number;
    pendingReports: number;
    totalConversations: number;
    totalMessages: number;
    totalParticipations: number;
};

export type UserRegistrationStats = {
    totalUsers: number;
    newRegistrations: {
        _id: string; // Date string format YYYY-MM-DD
        count: number;
    }[];
};

export type AdminUser = {
    _id: string;
    name: string;
    email: string;
    avatarURL: string;
    area: string;
    occupation: string;
    introduction: string;
    role: 'user' | 'admin';
    isRestricted: boolean;
    restrictedUntil: string | null;
    createdAt: string;
};

export type AdminReport = {
    _id: string;
    reportType: string;
    reason: string;
    detail: string;
    status: string;
    decision: 'pending' | 'approved' | 'rejected';
    decisionReason: string;
    decisionDate: string | null;
    banDays: number;
    reporter: {
        _id: string;
        name: string;
        email: string;
        avatarURL: string;
    };
    user?: {
        _id: string;
        name: string;
        email: string;
        avatarURL: string;
        role: string;
    };
    event?: {
        _id: string;
        title: string;
        imageURL: string;
        status: string;
    };
    decidedBy?: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
};

export type AdminEvent = {
    _id: string;
    title: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    location: string;
    detail: string;
    imageURL: string;
    status: 'active' | 'inactive' | 'draft';
    organizer: {
        _id: string;
        name: string;
        email: string;
        avatarURL: string;
    };
    participants: string[];
    createdAt: string;
    updatedAt: string;
};

export type AdminOverview = {
    admins: AdminUser[];
    stats: {
        totalUsers: number;
        totalAdmins: number;
        totalEvents: number;
        activeEvents: number;
        totalReports: number;
        pendingReports: number;
    };
};

// Dashboard
export async function getAdminOverview(): Promise<AdminOverview> {
    try {
        const response = await api.get<{ success: boolean; data: AdminOverview }>("/admin/overview");
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to fetch admin overview");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function getAdminStats(): Promise<AdminStats> {
    try {
        const response = await api.get<{ success: boolean; data: AdminStats }>("/admin/stats");
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to fetch admin stats");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

// Users
export async function listUsers(): Promise<AdminUser[]> {
    try {
        const response = await api.get<{ success: boolean; data: AdminUser[] }>("/admin/users");
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to fetch users");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function getUserRegistrationStats(): Promise<UserRegistrationStats> {
    try {
        const response = await api.get<{ success: boolean; data: UserRegistrationStats }>("/admin/users/stats");
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to fetch user registration stats");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function getUserById(userId: string): Promise<AdminUser> {
    try {
        const response = await api.get<{ success: boolean; data: AdminUser }>(`/admin/users/${userId}`);
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to fetch user");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function toggleUserRestriction(userId: string, banDays: number = 7): Promise<AdminUser> {
    try {
        const response = await api.post<{ success: boolean; data: AdminUser }>(`/admin/users/${userId}/restriction`, {
            banDays,
        });
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to toggle user restriction");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function deleteUser(userId: string): Promise<void> {
    try {
        const response = await api.delete<{ success: boolean; message: string }>(`/admin/users/${userId}`);
        if (!response.data.success) {
            throw new Error(response.data.message || "Failed to delete user");
        }
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

// Reports
export async function listReports(): Promise<AdminReport[]> {
    try {
        const response = await api.get<{ success: boolean; data: AdminReport[] }>("/admin/reports");
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to fetch reports");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function getReportById(reportId: string): Promise<AdminReport> {
    try {
        const response = await api.get<{ success: boolean; data: AdminReport }>(`/admin/reports/${reportId}`);
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to fetch report");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function approveReport(
    reportId: string,
    banDays: number = 0,
    reason: string = ""
): Promise<AdminReport> {
    try {
        const response = await api.post<{ success: boolean; data: AdminReport }>(`/admin/reports/${reportId}/approve`, {
            banDays,
            reason,
        });
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to approve report");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function rejectReport(reportId: string, reason: string = ""): Promise<AdminReport> {
    try {
        const response = await api.post<{ success: boolean; data: AdminReport }>(`/admin/reports/${reportId}/reject`, {
            reason,
        });
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to reject report");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

// Events
export async function listAdminEvents(): Promise<AdminEvent[]> {
    try {
        const response = await api.get<{ success: boolean; data: AdminEvent[] }>("/admin/events");
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to fetch events");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function createAdminEvent(eventData: Partial<AdminEvent>): Promise<AdminEvent> {
    try {
        const response = await api.post<{ success: boolean; data: AdminEvent }>("/admin/events", eventData);
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to create event");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function updateAdminEvent(eventId: string, eventData: Partial<AdminEvent>): Promise<AdminEvent> {
    try {
        const response = await api.put<{ success: boolean; data: AdminEvent }>(`/admin/events/${eventId}`, eventData);
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to update event");
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export async function deleteAdminEvent(eventId: string): Promise<void> {
    try {
        const response = await api.delete<{ success: boolean; message: string }>(`/admin/events/${eventId}`);
        if (!response.data.success) {
            throw new Error(response.data.message || "Failed to delete event");
        }
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}
