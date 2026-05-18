import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { getConversations, UiConversation } from "../lib/conversationApi";

export function UserChatsList() {
    const [chats, setChats] = useState<UiConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const loadConversations = async () => {
            setLoading(true);
            setLoadError(null);
            try {
                const data = await getConversations();
                setChats(data);
            } catch (error: any) {
                setLoadError(
                    error?.message || "チャット一覧の取得に失敗しました。",
                );
            } finally {
                setLoading(false);
            }
        };

        loadConversations();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Logo />
                        <nav className="hidden md:flex items-center gap-6">
                            <Link
                                to="/user/home"
                                className="text-blue-600 font-medium"
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
                    <LanguageToggle />
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
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            チャット一覧
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
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
                        {!loading && !loadError && chats.length === 0 && (
                            <div className="p-6 text-center text-sm text-gray-500">
                                現在、チャットはありません。
                            </div>
                        )}
                        {!loading &&
                            !loadError &&
                            chats.map((chat) => (
                                <Link
                                    key={chat.id}
                                    to={`/user/chat/${chat.id}`}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                                >
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={chat.avatar} />
                                        <AvatarFallback>
                                            {chat.name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium text-sm truncate">
                                                {chat.name}
                                            </p>
                                            {chat.unread > 0 && (
                                                <Badge
                                                    variant="destructive"
                                                    className="shrink-0"
                                                >
                                                    {chat.unread}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 truncate">
                                            {chat.lastMessage}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {chat.time}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

