import { Link, useParams } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { ArrowLeft, MapPin, Briefcase, MessageCircle, Loader2, UserCheck, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { useEffect, useState } from "react";
import {
    getUserProfile,
    getFriendStatus,
    sendFriendRequest,
    type UiUser,
    type FriendStatus,
} from "../lib/userApi";

export function UserProfile() {
    const { id } = useParams();

    const [user, setUser] = useState<UiUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    // Friendship status
    const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
    const [statusLoading, setStatusLoading] = useState(false);

    // Actions
    const [requestSending, setRequestSending] = useState(false);
    const [requestError, setRequestError] = useState("");

    // Dialogs
    const [reportOpen, setReportOpen] = useState(false);
    const [friendOpen, setFriendOpen] = useState(false);
    const [reason, setReason] = useState("迷惑行為");

    useEffect(() => {
        if (!id) return;
        loadProfile();
        loadFriendStatus();
    }, [id]);

    const loadProfile = async () => {
        setIsLoading(true);
        setLoadError("");
        try {
            const profile = await getUserProfile(id!);
            setUser(profile);
        } catch {
            setLoadError("プロフィールの取得に失敗しました。URLまたはAPIを確認してください。");
        } finally {
            setIsLoading(false);
        }
    };

    const loadFriendStatus = async () => {
        setStatusLoading(true);
        try {
            const result = await getFriendStatus(id!);
            setFriendStatus(result.status);
        } catch {
            // Silently fail – default is "none"
        } finally {
            setStatusLoading(false);
        }
    };

    const handleSendRequest = async () => {
        if (!id) return;
        setRequestSending(true);
        setRequestError("");
        setFriendOpen(false);
        try {
            await sendFriendRequest(id);
            setFriendStatus("sent");
        } catch {
            setRequestError("フレンド申請に失敗しました。もう一度お試しください。");
        } finally {
            setRequestSending(false);
        }
    };

    const isFriend = friendStatus === "friend";
    const hasSent = friendStatus === "sent";
    const hasReceived = friendStatus === "received";

    const friendButtonLabel = () => {
        if (requestSending || statusLoading) return null;
        if (isFriend) return "フレンド";
        if (hasSent) return "申請済み";
        if (hasReceived) return "承認する";
        return "フレンド追加";
    };

    const userName = user?.name || "...";
    const userRole = user?.role || "...";
    const userLocation = user?.location || "...";
    const userIndustry = user?.industry || "...";
    const userIntro = user?.intro || "...";
    const userAvatar = user?.avatar || "";
    const userId = user?.id || id || "";

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Logo />
                        <nav className="hidden md:flex items-center gap-6">
                            <Link to="/user/home" className="text-gray-600 hover:text-gray-900">
                                ホーム
                            </Link>
                            <Link to="/user/search" className="text-gray-600 hover:text-gray-900">
                                検索
                            </Link>
                            <Link to="/user/friends" className="text-gray-600 hover:text-gray-900">
                                フレンド
                            </Link>
                            <Link to="/user/events" className="text-gray-600 hover:text-gray-900">
                                イベント
                            </Link>
                            <Link to="/user/mypage" className="text-gray-600 hover:text-gray-900">
                                マイページ
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <Button asChild variant="ghost" className="mb-6">
                    <Link to="/user/search">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        戻る
                    </Link>
                </Button>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column – Profile Card */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardContent className="p-6 text-center">
                                <Avatar className="h-40 w-40 mx-auto mb-4">
                                    <AvatarImage src={userAvatar} />
                                    <AvatarFallback className="text-3xl">{userName[0] || "U"}</AvatarFallback>
                                </Avatar>
                                <h1 className="text-2xl font-bold mb-1">{userName}</h1>
                                <p className="text-gray-600 mb-4">{userRole}</p>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                        <MapPin className="h-4 w-4" />
                                        <span>{userLocation}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                        <Briefcase className="h-4 w-4" />
                                        <span>{userIndustry}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {/* Chat – only enabled for actual friends */}
                                    <Button asChild className="w-full" disabled={!isFriend}>
                                        <Link to={`/user/chat/${userId}`}>
                                            <MessageCircle className="mr-2 h-4 w-4" />
                                            チャット
                                        </Link>
                                    </Button>

                                    {/* Friend action button */}
                                    {friendStatus !== "self" && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            disabled={
                                                isFriend ||
                                                hasSent ||
                                                requestSending ||
                                                statusLoading
                                            }
                                            onClick={() => {
                                                if (hasReceived) {
                                                    // Treat as "accept" – go to requests page
                                                    window.location.href = "/user/friend-requests";
                                                } else {
                                                    setFriendOpen(true);
                                                }
                                            }}
                                        >
                                            {requestSending || statusLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isFriend ? (
                                                <>
                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                    {friendButtonLabel()}
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    {friendButtonLabel()}
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {/* Request error feedback */}
                                    {requestError && (
                                        <p className="text-xs text-red-600">{requestError}</p>
                                    )}

                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => setReportOpen(true)}
                                    >
                                        通報
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column – Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4">自己紹介</h2>
                                {isLoading && (
                                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">読み込み中...</span>
                                    </div>
                                )}
                                {loadError && (
                                    <p className="text-sm text-red-600 mb-2">{loadError}</p>
                                )}
                                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                                    {userIntro}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Report Dialog */}
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ユーザー通報</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <select
                            aria-label="Select report reason"
                            className="w-full border rounded-md h-10 px-3"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        >
                            <option>迷惑行為</option>
                            <option>不適切な内容</option>
                            <option>虚偽の情報</option>
                            <option>スパム</option>
                            <option>その他</option>
                        </select>
                        <Textarea placeholder="詳細を入力してください" />
                    </div>
                    <DialogFooter>
                        <Button>送信</Button>
                        <Button variant="outline" onClick={() => setReportOpen(false)}>
                            キャンセル
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Friend Request Confirmation Dialog */}
            <Dialog open={friendOpen} onOpenChange={setFriendOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>フレンド申請を送信しますか？</DialogTitle>
                    </DialogHeader>
                    {user && (
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">{user.name}</span> さんにフレンド申請を送ります。
                        </p>
                    )}
                    <DialogFooter>
                        <Button onClick={handleSendRequest} disabled={requestSending}>
                            {requestSending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <UserPlus className="mr-2 h-4 w-4" />
                            )}
                            送信
                        </Button>
                        <Button variant="outline" onClick={() => setFriendOpen(false)}>
                            キャンセル
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
