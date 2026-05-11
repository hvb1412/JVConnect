import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
    getIncomingRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    type FriendRequestData,
} from "../lib/userApi";
import { UserCheck, UserX, Loader2, InboxIcon } from "lucide-react";

export function UserFriendRequests() {
    const [requests, setRequests] = useState<FriendRequestData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setIsLoading(true);
            setError("");
            const data = await getIncomingRequests();
            setRequests(data);
        } catch {
            setError("フレンドリクエストの読み込みに失敗しました。");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (requestId: string) => {
        setProcessingId(requestId);
        try {
            await acceptFriendRequest(requestId);
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
        } catch {
            setError("承認に失敗しました。もう一度お試しください。");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        setProcessingId(requestId);
        try {
            await rejectFriendRequest(requestId);
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
        } catch {
            setError("拒否に失敗しました。もう一度お試しください。");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Logo />
                        <nav className="hidden md:flex items-center gap-6">
                            <Link to="/user/home">ホーム</Link>
                            <Link to="/user/search">検索</Link>
                            <Link to="/user/friends" className="text-blue-600 font-medium">フレンド</Link>
                            <Link to="/user/events">イベント</Link>
                            <Link to="/user/mypage">マイページ</Link>
                        </nav>
                    </div>
                    <LanguageToggle />
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">フレンドリクエスト</h1>
                        <p className="text-gray-600 text-sm mt-1">届いたリクエストを管理する</p>
                    </div>
                    <Button asChild variant="outline">
                        <Link to="/user/friends">← フレンド一覧</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            フレンドリクエスト
                            {!isLoading && requests.length > 0 && (
                                <span className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold w-5 h-5">
                                    {requests.length}
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Error state */}
                        {error && (
                            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Loading state */}
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-gray-500 py-6 justify-center">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>読み込み中...</span>
                            </div>
                        ) : requests.length === 0 ? (
                            /* Empty state */
                            <div className="flex flex-col items-center gap-3 py-10 text-gray-400">
                                <InboxIcon className="h-10 w-10" />
                                <p className="text-sm">フレンドリクエストはありません</p>
                            </div>
                        ) : (
                            /* Request list */
                            requests.map((request) => {
                                const isProcessing = processingId === request.id;
                                return (
                                    <div
                                        key={request.id}
                                        className="border rounded-lg p-3 flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={request.sender.avatar} />
                                                <AvatarFallback>{request.sender.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{request.sender.name}</p>
                                                <p className="text-xs text-gray-500">{request.sender.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                disabled={isProcessing}
                                                onClick={() => handleAccept(request.id)}
                                            >
                                                {isProcessing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <UserCheck className="mr-1 h-4 w-4" />
                                                        承認
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={isProcessing}
                                                onClick={() => handleReject(request.id)}
                                            >
                                                {isProcessing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <UserX className="mr-1 h-4 w-4" />
                                                        拒否
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
