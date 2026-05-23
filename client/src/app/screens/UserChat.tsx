import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
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
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
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
} from "../lib/conversationApi";
import { initSocket } from "../lib/socket.ts";

export function UserChat() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [initiatorId, setInitiatorId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [chatUser, setChatUser] = useState<{
        id: string;
        name: string;
        role: string;
        avatar: string;
        online: boolean;
    } | null>(null);
    const [messages, setMessages] = useState<UiConversationMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentUserId = localStorage.getItem("userId") || "";

    // ─── Scroll to bottom whenever messages change ──────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ─── Load conversation ──────────────────────────────────────────────────
    useEffect(() => {
        const loadConversation = async () => {
            if (!id) {
                setLoadError("会話IDが見つかりません。");
                setLoading(false);
                return;
            }

            if (!currentUserId) {
                setLoadError("ユーザーがログインしていません。");
                setLoading(false);
                return;
            }

            setLoading(true);
            setLoadError(null);

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
                setIsPending(result.isPending);
                setInitiatorId(result.initiatorId);
                setChatUser({
                    id: result.partner._id,
                    name: result.partner.name,
                    role: "フレンド",
                    avatar: result.partner.avatarURL || "",
                    online: true,
                });
                setMessages(result.messages);

                // Mark as read only if accepted (don't mark pending messages from sender)
                if (!result.isPending) {
                    markConversationAsRead(result.conversationId);
                }
            } catch (error: any) {
                setLoadError(
                    error?.response?.data?.message ||
                        error?.message ||
                        "会話の読み込みに失敗しました。",
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

        const handleMessage = (payload: {
            message: BackendMessage;
            receiverId: string;
        }) => {
            if (!conversationId) return;

            const incomingConvId =
                typeof payload.message.conversation === "object"
                    ? payload.message.conversation?._id
                    : payload.message.conversation;

            if (!incomingConvId || incomingConvId !== conversationId) return;

            const incomingMessage = mapMessages(
                [payload.message],
                currentUserId,
                chatUser?.avatar || "",
            )[0];
            setMessages((prev) => [...prev, incomingMessage]);

            if (!isPending) {
                markConversationAsRead(incomingConvId);
            }
        };

        socket.on("receive_message", handleMessage);
        socket.on("message_request", handleMessage);

        return () => {
            socket.off("receive_message", handleMessage);
            socket.off("message_request", handleMessage);
        };
    }, [conversationId, chatUser?.avatar, isPending]);

    // ─── Derived state ──────────────────────────────────────────────────────
    const iAmInitiator = !!currentUserId && currentUserId === initiatorId;
    const iAmReceiver = !!currentUserId && !!initiatorId && currentUserId !== initiatorId;

    // Sender can always type; receiver can only type after accepting
    const canSendMessage = !isPending || iAmInitiator;

    // ─── Handlers ───────────────────────────────────────────────────────────
    const handleSendMessage = async () => {
        if (!message.trim() || !chatUser || !canSendMessage) return;
        if (!currentUserId) return;

        setSending(true);

        try {
            const payload = await sendMessage(
                conversationId,
                conversationId ? null : chatUser.id,
                message.trim(),
                currentUserId,
                chatUser.avatar,
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
            // Navigate away — conversation is deleted
            navigate("/user/chats");
        } catch (error: any) {
            console.error("Failed to decline message request", error);
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Logo />
                        <nav className="hidden md:flex items-center gap-6">
                            <Link to="/user/home" className="text-gray-600 hover:text-gray-900">ホーム</Link>
                            <Link to="/user/search" className="text-gray-600 hover:text-gray-900">検索</Link>
                            <Link to="/user/friends" className="text-gray-600 hover:text-gray-900">フレンド</Link>
                            <Link to="/user/events" className="text-gray-600 hover:text-gray-900">イベント</Link>
                            <Link to="/user/mypage" className="text-gray-600 hover:text-gray-900">マイページ</Link>
                        </nav>
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
                        チャット一覧
                    </Link>
                </Button>

                <Card className="flex-1 flex flex-col">
                    {/* ── Header ── */}
                    <div className="border-b border-gray-200 p-4 flex items-center gap-3 bg-white rounded-t-lg">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={chatUser?.avatar || "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"} />
                            <AvatarFallback>{chatUser?.name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="font-semibold">{chatUser?.name || "読み込み中..."}</h2>
                                {isPending && (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                                        メッセージリクエスト
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                {chatUser?.online && (
                                    <span className="h-2 w-2 bg-green-500 rounded-full" />
                                )}
                                {chatUser?.online ? "オンライン" : "オフライン"}
                            </p>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link to={`/user/profile/${chatUser?.id || ""}`}>
                                プロフィールを見る
                            </Link>
                        </Button>
                    </div>

                    {/* ── Load error ── */}
                    {loadError && (
                        <div className="px-4 pt-4">
                            <Alert className="border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-700">
                                <AlertTitle>読み込みエラー</AlertTitle>
                                <AlertDescription>{loadError}</AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* ── Pending banner: RECEIVER sees accept / decline ── */}
                    {!loading && isPending && iAmReceiver && (
                        <div className="px-4 pt-4">
                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                <div className="flex items-start gap-3">
                                    <MessageCircleWarning className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-blue-900">
                                            メッセージリクエスト
                                        </p>
                                        <p className="text-sm text-blue-700 mt-0.5">
                                            <strong>{chatUser?.name}</strong> さんからのメッセージリクエストです。承認するとチャットができるようになります。
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={handleAccept}
                                                disabled={actionLoading}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                                承認する
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-300 text-red-600 hover:bg-red-50"
                                                onClick={handleDecline}
                                                disabled={actionLoading}
                                            >
                                                <XCircle className="h-4 w-4 mr-1.5" />
                                                削除する
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Pending banner: SENDER sees "waiting" notice ── */}
                    {!loading && isPending && iAmInitiator && (
                        <div className="px-4 pt-4">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center gap-3">
                                <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                <p className="text-sm text-amber-800">
                                    メッセージリクエストを送信しました。相手が承認するまで返信できません。
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Messages ── */}
                    <CardContent className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-[240px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-sm text-gray-500">
                                読み込み中...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-sm text-gray-500 px-4">
                                <p className="font-medium text-gray-700 mb-1">メッセージはありません</p>
                                <p>最初のメッセージを送ってみましょう。</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`flex gap-2 max-w-[70%] ${msg.sender === "me" ? "flex-row-reverse" : ""}`}>
                                            {msg.sender === "other" && (
                                                <Avatar className="h-8 w-8 flex-shrink-0">
                                                    <AvatarImage src={msg.avatar || chatUser?.avatar || ""} />
                                                    <AvatarFallback>{chatUser?.name?.[0] || "?"}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div>
                                                <div className={`rounded-2xl px-4 py-2 ${
                                                    msg.sender === "me"
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-white border border-gray-200"
                                                }`}>
                                                    <p className="text-sm">{msg.text}</p>
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
                        {/* Receiver cannot send until they accept */}
                        {isPending && iAmReceiver ? (
                            <p className="text-sm text-center text-gray-500 py-2">
                                メッセージリクエストを承認すると返信できます。
                            </p>
                        ) : (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="メッセージを入力..."
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
        </div>
    );
}
