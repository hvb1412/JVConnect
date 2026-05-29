import axios from "axios";

// ─── Types ──────────────────────────────────────────────────────────────────

export type BackendUser = {
    _id: string;
    name: string;
    email?: string;
    avatarURL?: string;
    area?: string;
    occupation?: string;
    introduction?: string;
    latestBanDate?: string | null;
    role?: string;
    createdAt?: string;
    friendCount?: number;
    eventsAttended?: number;
    needsProfileUpdate?: boolean;
};

export type UiUser = {
    id: string;
    name: string;
    role: string;
    location: string;
    industry: string;
    intro: string;
    avatar: string;
    memberSince?: string;
    connections?: number;
    eventsAttended?: number;
    needsProfileUpdate?: boolean;
};

export type FriendshipData = {
    friendshipId: string;
    friend: UiUser;
};

export type FriendRequestData = {
    id: string;
    sender: UiUser;
    createdAt: string;
};

/** Relationship status between current user and a target user */
export type FriendStatus = "friend" | "sent" | "received" | "none" | "self";

type ApiResponse<T> = {
    success: boolean;
    data: T;
};

// ─── Axios instance ──────────────────────────────────────────────────────────

import { API_ENDPOINT } from "./config";

const api = axios.create({
    baseURL: API_ENDPOINT,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FALLBACK_AVATAR =
    "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

export function mapBackendUserToUi(user: BackendUser): UiUser {
    const role = user.occupation?.trim() || "Chua cap nhat";
    const location = user.area?.trim() || "Chua cap nhat";
    const intro = user.introduction?.trim() || "Chua cap nhat thong tin";
    const memberSince = user.createdAt
        ? new Intl.DateTimeFormat("ja-JP", {
              year: "numeric",
              month: "long",
          }).format(new Date(user.createdAt))
        : "未登録";
    return {
        id: user._id,
        name: user.name,
        role,
        location,
        industry: role,
        intro,
        avatar: user.avatarURL?.trim() || FALLBACK_AVATAR,
        memberSince,
        connections: user.friendCount ?? 0,
        eventsAttended: user.eventsAttended ?? 0,
        needsProfileUpdate: user.needsProfileUpdate ?? false,
    };
}

const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── User APIs ────────────────────────────────────────────────────────────────

export async function searchUsers(params: {
    keyword?: string;
    area?: string;
    occupation?: string;
}): Promise<UiUser[]> {
    const response = await api.get<ApiResponse<BackendUser[]>>("/users/match", {
        params,
        headers: getAuthHeader(),
    });

    const users = Array.isArray(response.data?.data) ? response.data.data : [];
    const currentUserRaw = localStorage.getItem("user");
    const currentUserId = currentUserRaw ? (() => {
        try {
            return JSON.parse(currentUserRaw)?._id ?? JSON.parse(currentUserRaw)?.id ?? null;
        } catch {
            return null;
        }
    })() : null;

    return users
        .filter((user) => !currentUserId || user._id !== currentUserId)
        .map(mapBackendUserToUi);
}

export async function getSuggestedUsers(): Promise<UiUser[]> {
    try {
        const response = await api.get<ApiResponse<BackendUser[]>>("/users/suggested", {
            headers: getAuthHeader(),
        });

        const users = Array.isArray(response.data?.data) ? response.data.data : [];
        return users.map(mapBackendUserToUi);
    } catch (error) {
        console.error("Failed to fetch suggested users", error);
        return [];
    }
}

export async function getUserProfile(id: string): Promise<UiUser> {
    const response = await api.get<ApiResponse<BackendUser>>(`/users/${id}`, {
        headers: getAuthHeader(),
    });

    return mapBackendUserToUi(response.data.data);
}

export async function updateUserProfile(profileData: {
    name?: string;
    avatarURL?: string;
    area?: string;
    occupation?: string;
    introduction?: string;
    language?: 'ja' | 'vi';
}): Promise<UiUser> {
    const response = await api.put<ApiResponse<BackendUser>>(
        `/users/profile`,
        profileData,
        { headers: getAuthHeader() },
    );
    return mapBackendUserToUi(response.data.data);
}

export async function requestChangePasswordOtp(currentPassword: string): Promise<void> {
    await api.post(
        `/users/profile/password/otp`,
        { currentPassword },
        { headers: getAuthHeader() },
    );
}

export async function changeUserPassword(currentPassword: string, newPassword: string, otp: string): Promise<void> {
    await api.put(
        `/users/profile/password`,
        { currentPassword, newPassword, otp },
        { headers: getAuthHeader() },
    );
}

export async function deleteUserAccount(): Promise<void> {
    await api.delete(`/users/profile`, {
        headers: getAuthHeader(),
    });
}

// ─── Friend List APIs ─────────────────────────────────────────────────────────

export async function getFriendList(): Promise<FriendshipData[]> {
    const response = await api.get<ApiResponse<{ friendshipId: string; friend: BackendUser }[]>>(
        "/friends",
        { headers: getAuthHeader() },
    );

    const items = Array.isArray(response.data?.data) ? response.data.data : [];
    return items.map((item) => ({
        friendshipId: item.friendshipId,
        friend: mapBackendUserToUi(item.friend),
    }));
}

export async function deleteFriend(friendId: string): Promise<boolean> {
    const response = await api.delete<ApiResponse<unknown>>(`/friends/${friendId}`, {
        headers: getAuthHeader(),
    });
    return response.data.success;
}

// ─── Friend Request APIs ──────────────────────────────────────────────────────

/**
 * Send a friend request to a user by their ID.
 */
export async function sendFriendRequest(receiverId: string): Promise<void> {
    await api.post(
        "/friends/requests",
        { receiverId },
        { headers: getAuthHeader() },
    );
}

/**
 * Get all incoming friend requests for the current user.
 */
export async function getIncomingRequests(): Promise<FriendRequestData[]> {
    const response = await api.get<ApiResponse<{ _id: string; sender: BackendUser; createdAt: string }[]>>(
        "/friends/requests",
        { headers: getAuthHeader() },
    );

    const items = Array.isArray(response.data?.data) ? response.data.data : [];
    return items.map((item) => ({
        id: item._id,
        sender: mapBackendUserToUi(item.sender),
        createdAt: item.createdAt,
    }));
}

/**
 * Accept an incoming friend request.
 */
export async function acceptFriendRequest(requestId: string): Promise<void> {
    await api.post(
        `/friends/requests/${requestId}/accept`,
        {},
        { headers: getAuthHeader() },
    );
}

/**
 * Reject (or cancel) a friend request.
 */
export async function rejectFriendRequest(requestId: string): Promise<void> {
    await api.delete(`/friends/requests/${requestId}`, {
        headers: getAuthHeader(),
    });
}

/**
 * Get the friendship status between the current user and a target user.
 */
export async function getFriendStatus(
    targetUserId: string,
): Promise<{ status: FriendStatus; requestId?: string }> {
    const response = await api.get<ApiResponse<{ status: FriendStatus; requestId?: string }>>(
        `/friends/status/${targetUserId}`,
        { headers: getAuthHeader() },
    );
    return response.data.data;
}

// ─── Report APIs ──────────────────────────────────────────────────────────────

export async function submitUserReport(params: {
    userId: string;
    reportType: string;
    reason: string;
    detail?: string;
}): Promise<void> {
    await api.post(
        '/reports',
        {
            userId: params.userId,
            reportType: params.reportType,
            reason: params.reason,
            detail: params.detail || '',
        },
        { headers: getAuthHeader() },
    );
}

export async function submitEventReport(params: {
    eventId: string;
    reportType: string;
    reason: string;
    detail?: string;
}): Promise<void> {
    await api.post(
        '/reports',
        {
            eventId: params.eventId,
            reportType: params.reportType,
            reason: params.reason,
            detail: params.detail || '',
        },
        { headers: getAuthHeader() },
    );
}
