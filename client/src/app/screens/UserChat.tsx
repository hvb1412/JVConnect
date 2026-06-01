import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { useTranslation } from "../lib/i18n";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import {
    ArrowLeft,
    Send,
    Clock,
    CheckCircle,
    XCircle,
    MessageCircleWarning,
    Pin,
    PinOff,
    RotateCcw,
    Users,
    ChevronDown,
    ChevronUp,
    MoreVertical,
    Trash2,
    LogOut,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
    getConversationMessages,
    getConversationWithUser,
    sendMessage,
    mapMessages,
    UiConversationMessage,
    BackendMessage,
    markConversationAsRead,
    acceptMessageRequest,
    declineMessageRequest,
    pinMessage,
    recallMessage,
    getPinnedMessages,
    BackendUser,
    deleteConversation,
    leaveGroupChat,
} from "../lib/conversationApi";
import { initSocket, checkOnline } from "../lib/socket.ts";

export function UserChat() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [initiatorId, setInitiatorId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [partnerOnline, setPartnerOnline] = useState(false);
    const [isGroup, setIsGroup] = useState(false);
    const [groupName, setGroupName] = useState<string>("");
    const [groupAvatar, setGroupAvatar] = useState<string>("");
    const [groupMembers, setGroupMembers] = useState<BackendUser[]>([]);
    const [groupAdminId, setGroupAdminId] = useState<string | null>(null);
    const [eventId, setEventId] = useState<string | null>(null);
    const [showMembers, setShowMembers] = useState(false);
    const [chatUser, setChatUser] = useState<{
        id: string;
        name: string;
        role: string;
        avatar: string;
    } | null>(null);
    const [messages, setMessages] = useState<UiConversationMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Context menu (right-click on message)
    const [contextMenu, setContextMenu] = useState<{
        msgId: string;
        msgSender: "me" | "other";
        isRecalled: boolean;
        isPinned: boolean;
        x: number;
        y: number;
    } | null>(null);

    // Pinned messages banner
    const [pinnedMessages, setPinnedMessages] = useState<BackendMessage[]>([]);
    const [showPinnedBanner, setShowPinnedBanner] = useState(true);
    const [showPinnedDialog, setShowPinnedDialog] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentUserId = localStorage.getItem("userId") || "";
    const isAdmin = localStorage.getItem("role") === "admin";

    // ─── Scroll to bottom whenever messages change ──────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ─── Close context menu on outside click ────────────────────────────────
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    // ─── Load pinned messages ───────────────────────────────────────────────
    const loadPinned = useCallback(async (convId: string) => {
        try {
            const pinned = await getPinnedMessages(convId);
            setPinnedMessages(pinned);
        } catch {
            // ignore
        }
    }, []);

    // ─── Load conversation ──────────────────────────────────────────────────
    useEffect(() => {
        const loadConversation = async () => {
            if (!id) {
                setLoadError(t("conversation_id_missing"));
                setLoading(false);
                return;
            }
            if (!currentUserId) {
                setLoadError(t("user_not_logged_in"));
                setLoading(false);
                return;
            }

            setLoading(true);
            setLoadError(null);
            initSocket(currentUserId);

            try {
                let convId = id;
                let result;

                try {
                    result = await getConversationMessages(convId, currentUserId);
                } catch (error: any) {
                    const status = error?.response?.status;
                    const msg = error?.response?.data?.message;

                    if (
                        status === 404 ||
                        msg === "Conversation not found" ||
                        msg === "Partner user not found"
                    ) {
                        const fallback = await getConversationWithUser(id);
                        convId = fallback.conversationId;
                        result = await getConversationMessages(convId, currentUserId);
                    } else {
                        throw error;
                    }
                }

                setConversationId(result.conversationId);
                setIsGroup(result.isGroup);

                if (result.isGroup) {
                    setGroupName(result.groupName || t("group_chat"));
                    setGroupAvatar(result.groupAvatar || "");
                    setGroupMembers(result.members || []);
                    setGroupAdminId(result.adminId || null);
                    setEventId(result.eventId || null);
                } else {
                    setIsPending(result.isPending);
                    setInitiatorId(result.initiatorId);
                    if (result.partner) {
                        setChatUser({
                            id: result.partner._id,
                            name: result.partner.name,
                            role: t("friend_role"),
                            avatar: result.partner.avatarURL || "",
                        });
                        const online = await checkOnline(result.partner._id);
                        setPartnerOnline(online);
                    }
                }

                setMessages(result.messages);
                await loadPinned(result.conversationId);

                if (!result.isPending) {
                    markConversationAsRead(result.conversationId);
                }
            } catch (error: any) {
                setLoadError(
                    error?.response?.data?.message ||
                        error?.message ||
                        t("conversation_load_failed"),
                );
            } finally {
                setLoading(false);
            }
        };

        loadConversation();
    }, [id]);

    // ─── Socket events ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!currentUserId) return;
        const socket = initSocket(currentUserId);
        if (!socket) return;

        const handleMessage = (payload: { message: BackendMessage; conversationId?: string; receiverId?: string }) => {
            if (!conversationId) return;

            const incomingConvId =
                payload.conversationId ||
                (typeof payload.message.conversation === "object"
                    ? payload.message.conversation?._id
                    : payload.message.conversation);

            if (!incomingConvId || incomingConvId !== conversationId) return;

            const partnerAvatar = isGroup ? "" : (chatUser?.avatar || "");
            const incomingMessage = mapMessages([payload.message], currentUserId, partnerAvatar)[0];
            setMessages((prev) => [...prev, incomingMessage]);

            if (!isPending) {
                markConversationAsRead(incomingConvId);
            }
        };

        const handlePinned = (payload: { message: BackendMessage; conversationId: string }) => {
            if (payload.conversationId !== conversationId) return;
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === payload.message._id
                        ? { ...m, isPinned: true, pinnedBy: payload.message.pinnedBy as BackendUser, pinnedAt: payload.message.pinnedAt || null }
                        : m
                )
            );
            setPinnedMessages((prev) => {
                const exists = prev.find((p) => p._id === payload.message._id);
                if (!exists) return [payload.message, ...prev];
                return prev;
            });
        };

        const handleUnpinned = (payload: { message: BackendMessage; conversationId: string }) => {
            if (payload.conversationId !== conversationId) return;
            setMessages((prev) =>
                prev.map((m) => m.id === payload.message._id ? { ...m, isPinned: false } : m)
            );
            setPinnedMessages((prev) => prev.filter((p) => p._id !== payload.message._id));
        };

        const handleRecalled = (payload: { messageId: string; conversationId: string }) => {
            if (payload.conversationId !== conversationId) return;
            setMessages((prev) =>
                prev.map((m) => m.id === payload.messageId ? { ...m, isRecalled: true, isPinned: false } : m)
            );
            setPinnedMessages((prev) => prev.filter((p) => p._id !== payload.messageId));
        };

        const handleOnline = (data: { userId: string }) => {
            if (chatUser && data.userId === chatUser.id) setPartnerOnline(true);
        };

        const handleOffline = (data: { userId: string }) => {
            if (chatUser && data.userId === chatUser.id) setPartnerOnline(false);
        };

        socket.on("receive_message", handleMessage);
        socket.on("message_request", handleMessage);
        socket.on("message_pinned", handlePinned);
        socket.on("message_unpinned", handleUnpinned);
        socket.on("message_recalled", handleRecalled);
        socket.on("user_online", handleOnline);
        socket.on("user_offline", handleOffline);

        return () => {
            socket.off("receive_message", handleMessage);
            socket.off("message_request", handleMessage);
            socket.off("message_pinned", handlePinned);
            socket.off("message_unpinned", handleUnpinned);
            socket.off("message_recalled", handleRecalled);
            socket.off("user_online", handleOnline);
            socket.off("user_offline", handleOffline);
        };
    }, [conversationId, chatUser?.avatar, chatUser?.id, isPending, isGroup]);

    // ─── Derived state ──────────────────────────────────────────────────────
    const iAmInitiator = !!currentUserId && currentUserId === initiatorId;
    const iAmReceiver = !!currentUserId && !!initiatorId && currentUserId !== initiatorId;
    const canSendMessage = !isPending || iAmInitiator;

    // ─── Handlers ───────────────────────────────────────────────────────────
    const handleSendMessage = async () => {
        if (!message.trim() || !canSendMessage) return;
        if (!currentUserId) return;
        if (!isGroup && !chatUser) return;

        setSending(true);
        try {
            const payload = await sendMessage(
                conversationId,
                conversationId ? null : (chatUser?.id || null),
                message.trim(),
                currentUserId,
                chatUser?.avatar || "",
            );
            setMessages((prev) => [...prev, payload]);
            setMessage("");
        } catch (error: any) {
            console.error("Failed to send message", error);
        } finally {
            setSending(false);
        }
    };

    const handleAccept = async () => {
        if (!conversationId) return;
        setActionLoading(true);
        try {
            await acceptMessageRequest(conversationId);
            setIsPending(false);
            setInitiatorId(null);
            markConversationAsRead(conversationId);
        } catch (error: any) {
            console.error("Failed to accept message request", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDecline = async () => {
        if (!conversationId) return;
        setActionLoading(true);
        try {
            await declineMessageRequest(conversationId);
            navigate("/user/chats");
        } catch (error: any) {
            console.error("Failed to decline message request", error);
            setActionLoading(false);
        }
    };

    const handleContextMenu = (
        e: React.MouseEvent,
        msg: UiConversationMessage,
    ) => {
        e.preventDefault();
        if (msg.isRecalled) return;
        setContextMenu({
            msgId: msg.id,
            msgSender: msg.sender,
            isRecalled: !!msg.isRecalled,
            isPinned: !!msg.isPinned,
            x: e.clientX,
            y: e.clientY,
        });
    };

    const handlePin = async (msgId: string) => {
        setContextMenu(null);
        try {
            await pinMessage(msgId);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === msgId ? { ...m, isPinned: !m.isPinned } : m
                )
            );
            if (conversationId) await loadPinned(conversationId);
        } catch (error: any) {
            console.error("Pin failed", error);
        }
    };

    const handleRecall = async (msgId: string) => {
        setContextMenu(null);
        try {
            await recallMessage(msgId);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === msgId ? { ...m, isRecalled: true, isPinned: false, text: "" } : m
                )
            );
            setPinnedMessages((prev) => prev.filter((p) => p._id !== msgId));
        } catch (error: any) {
            console.error("Recall failed", error);
        }
    };

    const handleDeleteChat = async () => {
        if (!window.confirm(t("confirm_delete_chat", { defaultValue: "本当にこのチャットを削除しますか？" }))) return;
        if (!conversationId) return;
        
        try {
            await deleteConversation(conversationId);
            navigate("/user/chats");
        } catch (error: any) {
            console.error("Failed to delete conversation", error);
            alert(error?.message || t("delete_failed", { defaultValue: "削除に失敗しました" }));
        }
    };

    const handleLeaveGroup = async () => {
        if (!window.confirm(t("confirm_leave_group", { defaultValue: "本当にこのグループを退出しますか？" }))) return;
        if (!conversationId) return;
        
        try {
            await leaveGroupChat(conversationId);
            navigate("/user/chats");
        } catch (error: any) {
            console.error("Failed to leave group", error);
            alert(error?.message || t("leave_failed", { defaultValue: "退出に失敗しました" }));
        }
    };

    const displayName = isGroup ? groupName : (chatUser?.name || t("loading"));
    const displayAvatar = isGroup ? groupAvatar : (chatUser?.avatar || "");

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Logo />
                        {isAdmin ? (
                            <nav className="hidden md:flex items-center gap-6">
                                <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-900">{t("admin_dashboard_title")}</Link>
                                <Link to="/admin/users" className="text-gray-600 hover:text-gray-900">{t("users_manage")}</Link>
                                <Link to="/admin/events" className="text-gray-600 hover:text-gray-900">{t("events_manage")}</Link>
                                <Link to="/admin/reports" className="text-gray-600 hover:text-gray-900">{t("reports_manage")}</Link>
                                <Link to="/user/chats" className="text-blue-600 font-medium">{t("messages_title", { defaultValue: "Tin nhắn" })}</Link>
                            </nav>
                        ) : (
                            <nav className="hidden md:flex items-center gap-6">
                                <Link to="/user/home" className="text-gray-600 hover:text-gray-900">{t("nav_home")}</Link>
                                <Link to="/user/search" className="text-gray-600 hover:text-gray-900">{t("nav_search")}</Link>
                                <Link to="/user/friends" className="text-gray-600 hover:text-gray-900">{t("nav_friends")}</Link>
                                <Link to="/user/events" className="text-gray-600 hover:text-gray-900">{t("nav_events")}</Link>
                                <Link to="/user/mypage" className="text-gray-600 hover:text-gray-900">{t("nav_mypage")}</Link>
                            </nav>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <HeaderActions />
                    </div>
                </div>
            </header>

            <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 py-8">
                <Button asChild variant="ghost" className="mb-6 self-start">
                    <Link to="/user/chats">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t("chats_list")}
                    </Link>
                </Button>

                <Card className="flex-1 flex flex-col">
                    {/* ── Header ── */}
                    <div className="border-b border-gray-200 p-4 flex items-center gap-3 bg-white rounded-t-lg">
                        <div className="relative">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={displayAvatar || "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"} />
                                <AvatarFallback>{displayName?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            {isGroup && (
                                <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Users className="h-3 w-3 text-white" />
                                </span>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="font-semibold">{displayName}</h2>
                                {isGroup && !eventId && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                                        {t("group_chat")}
                                    </Badge>
                                )}
                                {isGroup && eventId && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 ml-1">
                                        {t("event_group")}
                                    </Badge>
                                )}
                                {isPending && !isGroup && (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                                        {t("message_request")}
                                    </Badge>
                                )}
                            </div>
                            {isGroup ? (
                                <button
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                                    onClick={() => setShowMembers(!showMembers)}
                                >
                                    <Users className="h-3 w-3" />
                                    {groupMembers.length} {t("members")}
                                    {showMembers ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>
                            ) : (
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full transition-colors duration-500 ${partnerOnline ? "bg-green-500" : "bg-gray-300"}`} />
                                    {partnerOnline ? t("online") : t("offline")}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {pinnedMessages.length > 0 && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setShowPinnedDialog(true)} 
                                    className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                    title={t("pinned_messages") || "Ghim"}
                                >
                                    <Pin className="h-5 w-5" />
                                </Button>
                            )}
                            {!isGroup && chatUser && (
                                <Button asChild variant="outline" size="sm">
                                    <Link to={`/user/profile/${chatUser.id}`}>
                                        {t("view_profile")}
                                    </Link>
                                </Button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {isGroup ? (
                                        <DropdownMenuItem onClick={handleLeaveGroup} className="text-red-600 cursor-pointer">
                                            <LogOut className="h-4 w-4 mr-2" />
                                            {t("leave_group", { defaultValue: "退出" })}
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem onClick={handleDeleteChat} className="text-red-600 cursor-pointer">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            {t("delete_chat", { defaultValue: "チャットを削除" })}
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* ── Group members panel ── */}
                    {isGroup && showMembers && (
                        <div className="border-b border-gray-100 bg-blue-50 px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                                {groupMembers.map((member) => (
                                    <div key={member._id} className="flex items-center gap-1.5 bg-white rounded-full px-2 py-1 text-xs border border-blue-100">
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage src={member.avatarURL} />
                                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <span>{member.name}</span>
                                        {member._id === currentUserId && <span className="text-blue-500">(あなた)</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Pinned messages banner ── */}
                    {pinnedMessages.length > 0 && showPinnedBanner && conversationId && (
                        <div 
                            className="border-b border-yellow-200 bg-yellow-50 px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-yellow-100 transition-colors"
                            onClick={() => setShowPinnedDialog(true)}
                        >
                            <Pin className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-yellow-800 truncate">
                                    📌 {pinnedMessages[0].content}
                                </p>
                                {pinnedMessages.length > 1 && (
                                    <p className="text-xs text-yellow-600">+{pinnedMessages.length - 1} {t("more_pinned")}</p>
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowPinnedBanner(false);
                                }}
                                className="text-yellow-600 hover:text-yellow-800 text-xs flex-shrink-0 p-1"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* ── Load error ── */}
                    {loadError && (
                        <div className="px-4 pt-4">
                            <Alert className="border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-700">
                                <AlertTitle>{t("load_error_title")}</AlertTitle>
                                <AlertDescription>{loadError}</AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* ── Pending banner: RECEIVER ── */}
                    {!loading && isPending && iAmReceiver && (
                        <div className="px-4 pt-4">
                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                <div className="flex items-start gap-3">
                                    <MessageCircleWarning className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-blue-900">{t("message_request")}</p>
                                        <p className="text-sm text-blue-700 mt-0.5">
                                            <strong>{chatUser?.name}</strong> {t("message_request_from_user")}
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAccept} disabled={actionLoading}>
                                                <CheckCircle className="h-4 w-4 mr-1.5" /> {t("accept")}
                                            </Button>
                                            <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={handleDecline} disabled={actionLoading}>
                                                <XCircle className="h-4 w-4 mr-1.5" /> {t("delete")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Pending banner: SENDER ── */}
                    {!loading && isPending && iAmInitiator && (
                        <div className="px-4 pt-4">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center gap-3">
                                <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                <p className="text-sm text-amber-800">{t("message_request_sent_notice")}</p>
                            </div>
                        </div>
                    )}

                    {/* ── Messages ── */}
                    <CardContent className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-[240px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-sm text-gray-500">
                                {t("loading")}
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-sm text-gray-500 px-4">
                                <p className="font-medium text-gray-700 mb-1">{t("no_messages")}</p>
                                <p>{t("send_first_message_prompt")}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                                        onContextMenu={(e) => handleContextMenu(e, msg)}
                                    >
                                        <div className={`flex gap-2 max-w-[70%] ${msg.sender === "me" ? "flex-row-reverse" : ""}`}>
                                            {msg.sender === "other" && (
                                                <Avatar className="h-8 w-8 flex-shrink-0">
                                                    <AvatarImage src={msg.senderAvatar || chatUser?.avatar || ""} />
                                                    <AvatarFallback>{msg.senderName?.[0] || "?"}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div>
                                                {/* Sender name for group chat */}
                                                {isGroup && msg.sender === "other" && msg.senderName && (
                                                    <p className="text-xs text-gray-500 mb-0.5 ml-1">{msg.senderName}</p>
                                                )}
                                                <div
                                                    className={`rounded-2xl px-4 py-2 relative group ${
                                                        msg.isPinned
                                                            ? "ring-1 ring-yellow-400"
                                                            : ""
                                                    } ${
                                                        msg.sender === "me"
                                                            ? msg.isRecalled
                                                                ? "bg-gray-200 text-gray-400"
                                                                : "bg-blue-600 text-white"
                                                            : msg.isRecalled
                                                                ? "bg-gray-100 border border-gray-200 text-gray-400"
                                                                : "bg-white border border-gray-200"
                                                    }`}
                                                >
                                                    {msg.isRecalled ? (
                                                        <p className="text-sm italic flex items-center gap-1">
                                                            <RotateCcw className="h-3 w-3" />
                                                            {t("message_recalled_text")}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm">{msg.text}</p>
                                                    )}
                                                    {msg.isPinned && (
                                                        <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 rounded-full p-0.5">
                                                            <Pin className="h-2.5 w-2.5 text-white" />
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-xs text-gray-500 mt-1 ${msg.sender === "me" ? "text-right" : "text-left"}`}>
                                                    {msg.time}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </CardContent>

                    {/* ── Input area ── */}
                    <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
                        {isPending && iAmReceiver ? (
                            <p className="text-sm text-center text-gray-500 py-2">{t("approve_to_reply")}</p>
                        ) : (
                            <div className="flex gap-2">
                                <Input
                                    placeholder={t("message_input_placeholder")}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    className="flex-1"
                                    disabled={!canSendMessage || loading}
                                />
                                <Button
                                    size="icon"
                                    className="flex-shrink-0"
                                    disabled={!canSendMessage || !message.trim() || sending}
                                    onClick={handleSendMessage}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* ── Pinned Messages Dialog ── */}
            <Dialog open={showPinnedDialog} onOpenChange={setShowPinnedDialog}>
                <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pin className="h-5 w-5 text-yellow-500" />
                            {t("pinned_messages", { defaultValue: "Tin nhắn đã ghim" })}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 mt-4">
                        {pinnedMessages.map((msg) => (
                            <div key={msg._id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 relative group">
                                <div className="flex items-start gap-2 mb-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={msg.sender?.avatarURL || ""} />
                                        <AvatarFallback>{msg.sender?.name?.[0] || "?"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-700 truncate">{msg.sender?.name}</p>
                                        <p className="text-[10px] text-gray-500">
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handlePin(msg._id)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        title={t("unpin_message")}
                                    >
                                        <PinOff className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Context Menu ── */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[160px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => handlePin(contextMenu.msgId)}
                    >
                        {contextMenu.isPinned ? (
                            <><PinOff className="h-4 w-4 text-gray-500" /> {t("unpin_message")}</>
                        ) : (
                            <><Pin className="h-4 w-4 text-yellow-500" /> {t("pin_message")}</>
                        )}
                    </button>
                    {(contextMenu.msgSender === "me" || (isGroup && currentUserId && groupAdminId === currentUserId)) && (
                        <button
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                            onClick={() => handleRecall(contextMenu.msgId)}
                        >
                            <RotateCcw className="h-4 w-4" /> {t("recall_message")}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
