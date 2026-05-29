import axios from "axios";
// ─── Axios instance ──────────────────────────────────────────────────────────
import { API_ENDPOINT } from "./config";
const api = axios.create({
    baseURL: API_ENDPOINT,
});
// ─── Helpers ─────────────────────────────────────────────────────────────────
const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
export function mapBackendUserToUi(user) {
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
export async function searchUsers(params) {
    const response = await api.get("/users/match", {
        params,
        headers: getAuthHeader(),
    });
    const users = Array.isArray(response.data?.data) ? response.data.data : [];
    const currentUserRaw = localStorage.getItem("user");
    const currentUserId = currentUserRaw ? (() => {
        try {
            return JSON.parse(currentUserRaw)?._id ?? JSON.parse(currentUserRaw)?.id ?? null;
        }
        catch {
            return null;
        }
    })() : null;
    return users
        .filter((user) => !currentUserId || user._id !== currentUserId)
        .map(mapBackendUserToUi);
}
export async function getSuggestedUsers() {
    try {
        const response = await api.get("/users/suggested", {
            headers: getAuthHeader(),
        });
        const users = Array.isArray(response.data?.data) ? response.data.data : [];
        return users.map(mapBackendUserToUi);
    }
    catch (error) {
        console.error("Failed to fetch suggested users", error);
        return [];
    }
}
export async function getUserProfile(id) {
    const response = await api.get(`/users/${id}`, {
        headers: getAuthHeader(),
    });
    return mapBackendUserToUi(response.data.data);
}
export async function updateUserProfile(profileData) {
    const response = await api.put(`/users/profile`, profileData, { headers: getAuthHeader() });
    return mapBackendUserToUi(response.data.data);
}
export async function requestChangePasswordOtp(currentPassword) {
    await api.post(`/users/profile/password/otp`, { currentPassword }, { headers: getAuthHeader() });
}
export async function changeUserPassword(currentPassword, newPassword, otp) {
    await api.put(`/users/profile/password`, { currentPassword, newPassword, otp }, { headers: getAuthHeader() });
}
export async function deleteUserAccount() {
    await api.delete(`/users/profile`, {
        headers: getAuthHeader(),
    });
}
// ─── Friend List APIs ─────────────────────────────────────────────────────────
export async function getFriendList() {
    const response = await api.get("/friends", { headers: getAuthHeader() });
    const items = Array.isArray(response.data?.data) ? response.data.data : [];
    return items.map((item) => ({
        friendshipId: item.friendshipId,
        friend: mapBackendUserToUi(item.friend),
    }));
}
export async function deleteFriend(friendId) {
    const response = await api.delete(`/friends/${friendId}`, {
        headers: getAuthHeader(),
    });
    return response.data.success;
}
// ─── Friend Request APIs ──────────────────────────────────────────────────────
/**
 * Send a friend request to a user by their ID.
 */
export async function sendFriendRequest(receiverId) {
    await api.post("/friends/requests", { receiverId }, { headers: getAuthHeader() });
}
/**
 * Get all incoming friend requests for the current user.
 */
export async function getIncomingRequests() {
    const response = await api.get("/friends/requests", { headers: getAuthHeader() });
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
export async function acceptFriendRequest(requestId) {
    await api.post(`/friends/requests/${requestId}/accept`, {}, { headers: getAuthHeader() });
}
/**
 * Reject (or cancel) a friend request.
 */
export async function rejectFriendRequest(requestId) {
    await api.delete(`/friends/requests/${requestId}`, {
        headers: getAuthHeader(),
    });
}
/**
 * Get the friendship status between the current user and a target user.
 */
export async function getFriendStatus(targetUserId) {
    const response = await api.get(`/friends/status/${targetUserId}`, { headers: getAuthHeader() });
    return response.data.data;
}
// ─── Report APIs ──────────────────────────────────────────────────────────────
export async function submitUserReport(params) {
    await api.post('/reports', {
        userId: params.userId,
        reportType: params.reportType,
        reason: params.reason,
        detail: params.detail || '',
    }, { headers: getAuthHeader() });
}
export async function submitEventReport(params) {
    await api.post('/reports', {
        eventId: params.eventId,
        reportType: params.reportType,
        reason: params.reason,
        detail: params.detail || '',
    }, { headers: getAuthHeader() });
}
