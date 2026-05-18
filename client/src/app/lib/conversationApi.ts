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
    conversation?: { _id: string };
};

export type BackendConversationSummary = {
    conversationId: string;
    partner: BackendUser;
    latestMessage: BackendMessage | null;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
};

export type BackendConversationDetail = {
    conversation: {
        _id: string;
        user1: BackendUser;
        user2: BackendUser;
        latestMessage: BackendMessage | null;
        unreadCount: number;
        createdAt: string;
        updatedAt: string;
    };
    messages: BackendMessage[];
};

export type UiConversation = {
    id: string;
    name: string;
    partnerId: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread: number;
};

export type UiConversationMessage = {
    id: string;
    sender: "me" | "other";
    text: string;
    time: string;
    avatar?: string;
};

const api = axios.create({
    baseURL: "http://localhost:5000/api",
});

const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatMessageTime = (sendTime: string, createdAt: string) => {
    if (sendTime) {
        return sendTime;
    }

    const date = new Date(createdAt);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getAvatar = (user: BackendUser) => {
    return (
        user.avatarURL?.trim() ||
        "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    );
};

const mapConversation = (
    conversation: BackendConversationSummary,
): UiConversation => {
    const latestMessage = conversation.latestMessage;
    return {
        id: conversation.conversationId,
        partnerId: conversation.partner._id,
        name: conversation.partner.name,
        avatar: getAvatar(conversation.partner),
        lastMessage: latestMessage?.content || "まだメッセージがありません。",
        time: formatMessageTime(
            latestMessage?.sendTime || "",
            latestMessage?.createdAt || conversation.updatedAt,
        ),
        unread: conversation.unreadCount || 0,
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
        text: message.content,
        time: formatMessageTime(message.sendTime, message.createdAt),
        avatar:
            message.sender._id === currentUserId ? undefined : partnerAvatar,
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
    } = {
        content,
    };

    if (conversationId) {
        payload.conversationId = conversationId;
    }

    if (!conversationId && receiverId) {
        payload.receiverId = receiverId;
    }

    const response = await api.post<{
        success: boolean;
        data: { message: BackendMessage; receiverId: string };
    }>("/messages", payload, {
        headers: getAuthHeader(),
    });

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

export type ConversationDetailResponse = {
    partner: BackendUser;
    conversationId: string;
    messages: UiConversationMessage[];
};

export async function getConversationWithUser(
    partnerUserId: string,
): Promise<{ conversationId: string; partner: BackendUser }> {
    const response = await api.get<{
        success: boolean;
        data: {
            conversation: {
                _id: string;
                user1: BackendUser;
                user2: BackendUser;
            };
            partner: BackendUser;
        };
    }>(`/conversations/with/${partnerUserId}`, {
        headers: getAuthHeader(),
    });

    const data = response.data.data;
    return {
        conversationId: data.conversation._id,
        partner: data.partner,
    };
}

export async function getConversationMessages(
    conversationId: string,
    currentUserId: string,
): Promise<ConversationDetailResponse> {
    const response = await api.get<{
        success: boolean;
        data: BackendConversationDetail;
    }>(`/conversations/${conversationId}/messages`, {
        headers: getAuthHeader(),
    });

    const detail = response.data.data;
    const conversation = detail.conversation;
    const partner =
        String(conversation.user1._id) === String(currentUserId)
            ? conversation.user2
            : conversation.user1;
    const avatar = getAvatar(partner);

    return {
        partner,
        conversationId: conversation._id,
        messages: mapMessages(detail.messages, currentUserId, avatar),
    };
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
    try {
        await api.patch(`/conversations/${conversationId}/read`, {}, {
            headers: getAuthHeader(),
        });
    } catch {
        // Non-critical: silently ignore errors
    }
}
