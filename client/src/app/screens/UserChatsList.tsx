import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ArrowLeft, MessageCircle, MessageCircleWarning } from "lucide-react";
import {
    getConversations,
    getPendingConversations,
    UiConversation,
} from "../lib/conversationApi";
import { initSocket } from "../lib/socket";

type Tab = "chats" | "requests";

export function UserChatsList() {
    const [tab, setTab] = useState<Tab>("chats");
    const [chats, setChats] = useState<UiConversation[]>([]);
    const [pendingChats, setPendingChats] = useState<UiConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const currentUserId = localStorage.getItem("userId") || "";

    const loadData = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [accepted, pending] = await Promise.all([
                getConversations(),
                getPendingConversations(),
            ]);
            setChats(accepted);
            setPendingChats(pending);
        } catch (error: any) {
            setLoadError(error?.message || "チャット一覧の取得に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Realtime: listen for new message_request events to update pending badge
    useEffect(() => {
        if (!currentUserId) return;

        const socket = initSocket(currentUserId);
        if (!socket) return;

        const handleMessageRequest = () => {
            // Reload pending list when a new request arrives
            getPendingConversations()
                .then(setPendingChats)
                .catch(() => {});
        };

        socket.on("message_request", handleMessageRequest);

        return () => {
            socket.off("message_request", handleMessageRequest);
        };
    }, [currentUserId]);

    const displayList = tab === "chats" ? chats : pendingChats;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Logo />
                        <nav className="hidden md:flex items-center gap-6">
                            <Link to="/user/home" className="text-blue-600 font-medium">ホーム</Link>
                            <Link to="/user/search" className="text-gray-600 hover:text-gray-900">検索</Link>
                            <Link to="/user/friends" className="text-gray-600 hover:text-gray-900">フレンド</Link>
                            <Link to="/user/events" className="text-gray-600 hover:text-gray-900">イベント</Link>
                            <Link to="/user/mypage" className="text-gray-600 hover:text-gray-900">マイページ</Link>
                        </nav>
                    </div>
                    <HeaderActions />
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-8">
                <Button asChild variant="ghost" className="mb-6">
                    <Link to="/user/home">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        戻る
                    </Link>
                </Button>

                <Card>
                    <CardHeader className="pb-0">
                        <CardTitle className="flex items-center gap-2 mb-4">
                            <MessageCircle className="h-5 w-5" />
                            メッセージ
                        </CardTitle>

                        {/* ── Tabs ── */}
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setTab("chats")}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                    tab === "chats"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-800"
                                }`}
                            >
                                <MessageCircle className="h-4 w-4" />
                                チャット
                                {chats.reduce((acc, c) => acc + c.unread, 0) > 0 && (
                                    <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                                        {chats.reduce((acc, c) => acc + c.unread, 0)}
                                    </Badge>
                                )}
                            </button>
                            <button
                                onClick={() => setTab("requests")}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                    tab === "requests"
                                        ? "border-amber-500 text-amber-600"
                                        : "border-transparent text-gray-500 hover:text-gray-800"
                                }`}
                            >
                                <MessageCircleWarning className="h-4 w-4" />
                                メッセージリクエスト
                                {pendingChats.length > 0 && (
                                    <Badge className="text-xs px-1.5 py-0.5 min-w-[20px] text-center bg-amber-500 hover:bg-amber-500">
                                        {pendingChats.length}
                                    </Badge>
                                )}
                            </button>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-2 space-y-1">
                        {loading && (
                            <div className="p-6 text-center text-sm text-gray-500">
                                読み込み中...
                            </div>
                        )}
                        {loadError && (
                            <div className="p-6 text-center text-sm text-red-600">
                                {loadError}
                            </div>
                        )}

                        {/* Empty states */}
                        {!loading && !loadError && displayList.length === 0 && (
                            <div className="p-8 text-center">
                                {tab === "chats" ? (
                                    <>
                                        <MessageCircle className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm font-medium text-gray-600">チャットはありません</p>
                                        <p className="text-xs text-gray-400 mt-1">フレンドとチャットを始めましょう。</p>
                                    </>
                                ) : (
                                    <>
                                        <MessageCircleWarning className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm font-medium text-gray-600">メッセージリクエストはありません</p>
                                        <p className="text-xs text-gray-400 mt-1">新しいリクエストが届くとここに表示されます。</p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Conversation list */}
                        {!loading && !loadError && displayList.map((chat) => (
                            <Link
                                key={chat.id}
                                to={`/user/chat/${chat.id}`}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors border ${
                                    tab === "requests"
                                        ? "border-amber-100 bg-amber-50 hover:bg-amber-100 hover:border-amber-200"
                                        : "border-transparent hover:bg-gray-100 hover:border-gray-200"
                                }`}
                            >
                                <div className="relative">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={chat.avatar} />
                                        <AvatarFallback>{chat.name[0]}</AvatarFallback>
                                    </Avatar>
                                    {tab === "requests" && (
                                        <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-amber-500 rounded-full flex items-center justify-center">
                                            <MessageCircleWarning className="h-2.5 w-2.5 text-white" />
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-sm truncate">{chat.name}</p>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {tab === "requests" && (
                                                <Badge className="bg-amber-100 text-amber-800 border-0 text-xs px-1.5">
                                                    リクエスト
                                                </Badge>
                                            )}
                                            {tab === "chats" && chat.unread > 0 && (
                                                <Badge variant="destructive" className="shrink-0">
                                                    {chat.unread}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600 truncate">{chat.lastMessage}</p>
                                    <p className="text-xs text-gray-400">{chat.time}</p>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
