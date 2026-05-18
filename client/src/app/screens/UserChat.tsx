import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { ArrowLeft, Send, UserX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import {
    getConversationMessages,
    getConversationWithUser,
    sendMessage,
    mapMessages,
    UiConversationMessage,
    BackendMessage,
} from "../lib/conversationApi";
import { initSocket } from "../lib/socket.ts";

export function UserChat() {
    const { id } = useParams();
    const [message, setMessage] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
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

    useEffect(() => {
        const loadConversation = async () => {
            if (!id) {
                setLoadError("会話IDが見つかりません。。");
                setLoading(false);
                return;
            }

            const currentUserId = localStorage.getItem("userId") || "";
            if (!currentUserId) {
                setLoadError("ユーザーがログインしていません。");
                setLoading(false);
                return;
            }

            setLoading(true);
            setLoadError(null);

            try {
                let conversationId = id;
                let result;

                try {
                    result = await getConversationMessages(
                        conversationId,
                        currentUserId,
                    );
                } catch (error: any) {
                    const status = error?.response?.status;
                    const message = error?.response?.data?.message;

                    if (
                        status === 404 ||
                        message === "Conversation not found" ||
                        message === "Partner user not found"
                    ) {
                        const fallback = await getConversationWithUser(id);
                        conversationId = fallback.conversationId;
                        result = await getConversationMessages(
                            conversationId,
                            currentUserId,
                        );
                    } else {
                        throw error;
                    }
                }

                setConversationId(result.conversationId);
                setChatUser({
                    id: result.partner._id,
                    name: result.partner.name,
                    role: "フレンド",
                    avatar: result.partner.avatarURL || "",
                    online: true,
                });
                setMessages(result.messages);
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

    useEffect(() => {
        const currentUserId = localStorage.getItem("userId") || "";
        if (!currentUserId) {
            return;
        }

        const socket = initSocket(currentUserId);
        if (!socket) {
            return;
        }

        const handleReceiveMessage = (payload: {
            message: BackendMessage;
            receiverId: string;
        }) => {
            if (!conversationId) {
                return;
            }

            const incomingConversationId = payload.message.conversation?._id;
            if (
                !incomingConversationId ||
                incomingConversationId !== conversationId
            ) {
                return;
            }

            const incomingMessage = mapMessages(
                [payload.message],
                currentUserId,
                chatUser?.avatar || "",
            )[0];
            setMessages((prev) => [...prev, incomingMessage]);
        };

        socket.on("receive_message", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
        };
    }, [conversationId, chatUser?.avatar]);

    const handleSendMessage = async () => {
        if (!message.trim() || !chatUser) {
            return;
        }

        const currentUserId = localStorage.getItem("userId") || "";
        if (!currentUserId) {
            return;
        }

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

    const isFriend = !!chatUser && !loadError;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Logo />
                        <nav className="hidden md:flex items-center gap-6">
                            <Link
                                to="/user/home"
                                className="text-gray-600 hover:text-gray-900"
                            >
                                ホーム
                            </Link>
                            <Link
                                to="/user/search"
                                className="text-gray-600 hover:text-gray-900"
                            >
                                検索
                            </Link>
                            <Link
                                to="/user/friends"
                                className="text-gray-600 hover:text-gray-900"
                            >
                                フレンド
                            </Link>
                            <Link
                                to="/user/events"
                                className="text-gray-600 hover:text-gray-900"
                            >
                                イベント
                            </Link>
                            <Link
                                to="/user/mypage"
                                className="text-gray-600 hover:text-gray-900"
                            >
                                マイページ
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageToggle />
                    </div>
                </div>
            </header>

            <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 py-8">
                <Button asChild variant="ghost" className="mb-6 self-start">
                    <Link to="/user/home">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        戻る
                    </Link>
                </Button>

                <Card className="flex-1 flex flex-col">
                    <div className="border-b border-gray-200 p-4 flex items-center gap-3 bg-white rounded-t-lg">
                        <Avatar className="h-12 w-12">
                            <AvatarImage
                                src={
                                    chatUser?.avatar ||
                                    "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                                }
                            />
                            <AvatarFallback>
                                {chatUser?.name?.[0] || "?"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="font-semibold">
                                    {chatUser?.name || "読み込み中..."}
                                </h2>
                                {isFriend ? (
                                    <Badge
                                        variant="secondary"
                                        className="bg-green-50 text-green-800 border-green-200"
                                    >
                                        フレンド
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="secondary"
                                        className="bg-amber-100 text-amber-900 border-amber-200"
                                    >
                                        未フレンド
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                {chatUser?.online && (
                                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
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

                    {loadError && (
                        <div className="px-4 pb-2">
                            <Alert className="border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-700">
                                <AlertTitle>読み込みエラー</AlertTitle>
                                <AlertDescription>{loadError}</AlertDescription>
                            </Alert>
                        </div>
                    )}

                    <CardContent className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-[240px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-sm text-gray-500">
                                読み込み中...
                            </div>
                        ) : isFriend ? (
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`flex gap-2 max-w-[70%] ${msg.sender === "me" ? "flex-row-reverse" : ""}`}
                                        >
                                            {msg.sender === "other" && (
                                                <Avatar className="h-8 w-8 flex-shrink-0">
                                                    <AvatarImage
                                                        src={
                                                            msg.avatar ||
                                                            chatUser?.avatar ||
                                                            ""
                                                        }
                                                    />
                                                    <AvatarFallback>
                                                        {chatUser?.name?.[0] ||
                                                            "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div>
                                                <div
                                                    className={`rounded-2xl px-4 py-2 ${
                                                        msg.sender === "me"
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-white border border-gray-200"
                                                    }`}
                                                >
                                                    <p className="text-sm">
                                                        {msg.text}
                                                    </p>
                                                </div>
                                                <p
                                                    className={`text-xs text-gray-500 mt-1 ${
                                                        msg.sender === "me"
                                                            ? "text-right"
                                                            : "text-left"
                                                    }`}
                                                >
                                                    {msg.time}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-sm text-gray-500 px-4">
                                <p className="font-medium text-gray-700 mb-1">
                                    メッセージはありません
                                </p>
                                <p>
                                    フレンドになると、ここで会話が表示されます。
                                </p>
                            </div>
                        )}
                    </CardContent>

                    <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
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
                                disabled={!isFriend}
                            />
                            <Button
                                size="icon"
                                className="flex-shrink-0"
                                disabled={
                                    !isFriend || !message.trim() || sending
                                }
                                onClick={handleSendMessage}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        {!isFriend && (
                            <p className="text-sm text-amber-800 mt-2">
                                未フレンドのため送信できません。プロフィールからフレンド申請を行ってください。
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
