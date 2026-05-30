import axios from "axios";

export type BackendUser = {
    _id: string;
    name: string;
    email?: string;
    avatarURL?: string;
};

export type BackendMessage = {
    _id: string;
    sender: BackendUser;
    content: string;
    sendTime: string;
    createdAt: string;
    seenStatus?: boolean;
    isRecalled?: boolean;
    isPinned?: boolean;
    pinnedBy?: BackendUser | null;
    pinnedAt?: string | null;
    readBy?: string[];
    conversation?: { _id: string; status?: string; initiator?: string; type?: string; members?: string[] };
};

export type BackendConversationSummary = {
    conversationId: string;
    type: "direct" | "group";
    // Direct fields
    partner?: BackendUser;
    status?: "pending" | "accepted";
    initiator?: string | null;
    // Group fields
    name?: string;
    avatarURL?: string;
    members?: BackendUser[];
    admin?: BackendUser;
    eventId?: string | null;
    // Common
    latestMessage: BackendMessage | null;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
};

export type BackendConversationDetail = {
    conversation: {
        _id: string;
        type: "direct" | "group";
        // Direct
        user1?: BackendUser;
        user2?: BackendUser;
        status?: "pending" | "accepted";
        initiator?: string | null;
        // Group
        name?: string;
        avatarURL?: string;
        members?: BackendUser[];
        admin?: BackendUser;
        eventId?: string | null;
        latestMessage?: BackendMessage | null;
        unreadCount?: number;
        createdAt: string;
        updatedAt: string;
    };
    messages: BackendMessage[];
};

export type UiConversation = {
    id: string;
    type: "direct" | "group";
    // Direct
    name: string;
    partnerId?: string;
    avatar: string;
    // Group
    members?: BackendUser[];
    adminId?: string;
    eventId?: string | null;
    // Common
    lastMessage: string;
    time: string;
    unread: number;
    isPending: boolean;
    initiatorId?: string | null;
};

export type UiConversationMessage = {
    id: string;
    sender: "me" | "other";
    senderName?: string;
    senderAvatar?: string;
    text: string;
    time: string;
    avatar?: string;
    isRecalled?: boolean;
    isPinned?: boolean;
    pinnedBy?: BackendUser | null;
    pinnedAt?: string | null;
};

import { API_ENDPOINT } from "./config";

const api = axios.create({
    baseURL: API_ENDPOINT,
});

const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatMessageTime = (sendTime: string, createdAt: string) => {
    if (sendTime) return sendTime;
    const date = new Date(createdAt);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getAvatar = (user: BackendUser) => {
    return (
        user.avatarURL?.trim() ||
        "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    );
};

const mapConversation = (conversation: BackendConversationSummary): UiConversation => {
    const latestMessage = conversation.latestMessage;

    if (conversation.type === "group") {
        const firstMember = conversation.members?.[0];
        return {
            id: conversation.conversationId,
            type: "group",
            name: conversation.name || "グループ",
            avatar: conversation.avatarURL || (firstMember ? getAvatar(firstMember) : ""),
            members: conversation.members,
            adminId: conversation.admin?._id,
            eventId: conversation.eventId,
            lastMessage: latestMessage?.content || "まだメッセージがありません。",
            time: formatMessageTime(
                latestMessage?.sendTime || "",
                latestMessage?.createdAt || conversation.updatedAt,
            ),
            unread: conversation.unreadCount || 0,
            isPending: false,
        };
    }

    return {
        id: conversation.conversationId,
        type: "direct",
        partnerId: conversation.partner?._id,
        name: conversation.partner?.name || "",
        avatar: conversation.partner ? getAvatar(conversation.partner) : "",
        lastMessage: latestMessage?.content || "まだメッセージがありません。",
        time: formatMessageTime(
            latestMessage?.sendTime || "",
            latestMessage?.createdAt || conversation.updatedAt,
        ),
        unread: conversation.unreadCount || 0,
        isPending: conversation.status === "pending",
        initiatorId: conversation.initiator ?? null,
    };
};

export const mapMessages = (
    messages: BackendMessage[],
    currentUserId: string,
    partnerAvatar: string,
): UiConversationMessage[] => {
    return messages.map((message) => ({
        id: message._id,
        sender: message.sender._id === currentUserId ? "me" : "other",
        senderName: message.sender.name,
        senderAvatar: getAvatar(message.sender),
        text: message.content,
        time: formatMessageTime(message.sendTime, message.createdAt),
        avatar: message.sender._id === currentUserId ? undefined : partnerAvatar,
        isRecalled: message.isRecalled,
        isPinned: message.isPinned,
        pinnedBy: message.pinnedBy ?? null,
        pinnedAt: message.pinnedAt ?? null,
    }));
};

export async function sendMessage(
    conversationId: string | null,
    receiverId: string | null,
    content: string,
    currentUserId: string,
    partnerAvatar: string,
): Promise<UiConversationMessage> {
    const payload: {
        conversationId?: string;
        receiverId?: string;
        content: string;
    } = { content };

    if (conversationId) payload.conversationId = conversationId;
    if (!conversationId && receiverId) payload.receiverId = receiverId;

    const response = await api.post<{
        success: boolean;
        data: {
            message: BackendMessage;
            receiverId: string;
            conversationStatus: string;
            conversationId: string;
        };
    }>("/messages", payload, { headers: getAuthHeader() });

    const message = response.data.data.message;
    return mapMessages([message], currentUserId, partnerAvatar)[0];
}

export async function getConversations(): Promise<UiConversation[]> {
    const response = await api.get<{
        success: boolean;
        data: BackendConversationSummary[];
    }>("/conversations", { headers: getAuthHeader() });

    const data = Array.isArray(response.data?.data) ? response.data.data : [];
    return data.map(mapConversation);
}

export async function getPendingConversations(): Promise<UiConversation[]> {
    const response = await api.get<{
        success: boolean;
        data: BackendConversationSummary[];
    }>("/conversations/pending", { headers: getAuthHeader() });

    const data = Array.isArray(response.data?.data) ? response.data.data : [];
    return data.map(mapConversation);
}

export type ConversationDetailResponse = {
    partner?: BackendUser;
    conversationId: string;
    isPending: boolean;
    initiatorId: string | null;
    messages: UiConversationMessage[];
    isGroup: boolean;
    groupName?: string;
    groupAvatar?: string;
    members?: BackendUser[];
    adminId?: string;
    eventId?: string | null;
};

export async function getConversationWithUser(
    partnerUserId: string,
): Promise<{ conversationId: string; partner: BackendUser; isPending: boolean; initiatorId: string | null }> {
    const response = await api.get<{
        success: boolean;
        data: {
            conversation: {
                _id: string;
                user1: BackendUser;
                user2: BackendUser;
                status: "pending" | "accepted";
                initiator: string | null;
            };
            partner: BackendUser;
        };
    }>(`/conversations/with/${partnerUserId}`, { headers: getAuthHeader() });

    const data = response.data.data;
    return {
        conversationId: data.conversation._id,
        partner: data.partner,
        isPending: data.conversation.status === "pending",
        initiatorId: data.conversation.initiator ?? null,
    };
}

export async function getConversationMessages(
    conversationId: string,
    currentUserId: string,
): Promise<ConversationDetailResponse> {
    const response = await api.get<{
        success: boolean;
        data: BackendConversationDetail;
    }>(`/conversations/${conversationId}/messages`, { headers: getAuthHeader() });

    const detail = response.data.data;
    const conversation = detail.conversation;

    if (conversation.type === "group") {
        return {
            conversationId: conversation._id,
            isPending: false,
            initiatorId: null,
            isGroup: true,
            groupName: conversation.name,
            groupAvatar: conversation.avatarURL,
            members: conversation.members,
            adminId: conversation.admin?._id,
            eventId: conversation.eventId,
            messages: mapMessages(detail.messages, currentUserId, ""),
        };
    }

    // Direct chat
    const partner =
        String(conversation.user1!._id) === String(currentUserId)
            ? conversation.user2!
            : conversation.user1!;
    const avatar = getAvatar(partner);

    return {
        partner,
        conversationId: conversation._id,
        isPending: conversation.status === "pending",
        initiatorId: conversation.initiator ?? null,
        isGroup: false,
        messages: mapMessages(detail.messages, currentUserId, avatar),
    };
}

export async function createGroupChat(
    name: string,
    memberIds: string[],
    avatarURL?: string,
): Promise<{ conversationId: string; name: string; members: BackendUser[] }> {
    const response = await api.post<{
        success: boolean;
        data: {
            _id: string;
            name: string;
            members: BackendUser[];
            admin: BackendUser;
            type: string;
        };
    }>(
        "/conversations/group",
        { name, memberIds, avatarURL },
        { headers: getAuthHeader() }
    );
    const data = response.data.data;
    return {
        conversationId: data._id,
        name: data.name,
        members: data.members,
    };
}

export async function pinMessage(messageId: string): Promise<void> {
    await api.patch(`/messages/${messageId}/pin`, {}, { headers: getAuthHeader() });
}

export async function recallMessage(messageId: string): Promise<void> {
    await api.patch(`/messages/${messageId}/recall`, {}, { headers: getAuthHeader() });
}

export async function getPinnedMessages(conversationId: string): Promise<BackendMessage[]> {
    const response = await api.get<{ success: boolean; data: BackendMessage[] }>(
        `/conversations/${conversationId}/pinned`,
        { headers: getAuthHeader() }
    );
    return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function acceptMessageRequest(conversationId: string): Promise<void> {
    await api.patch(`/conversations/${conversationId}/accept`, {}, { headers: getAuthHeader() });
}

export async function declineMessageRequest(conversationId: string): Promise<void> {
    await api.delete(`/conversations/${conversationId}/decline`, { headers: getAuthHeader() });
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
    try {
        await api.patch(`/conversations/${conversationId}/read`, {}, { headers: getAuthHeader() });
    } catch {
        // Non-critical: silently ignore errors
    }
}
