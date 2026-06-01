import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { useTranslation } from "../lib/i18n";
import { Search, MapPin, Briefcase, Loader2, UserPlus, Check } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { searchUsers, sendFriendRequest, getFriendStatus, type UiUser } from "../lib/userApi";

export function UserSearch() {
    const { t } = useTranslation();
    const [keyword, setKeyword] = useState("");
    const [location, setLocation] = useState("");
    const [industry, setIndustry] = useState("");
    const [users, setUsers] = useState<UiUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [friendModalOpen, setFriendModalOpen] = useState(false);

    // Track request states per user: "idle" | "sending" | "sent" | "error" | "friend"
    const [requestStates, setRequestStates] = useState<Record<string, "idle" | "sending" | "sent" | "error" | "friend">>({});
    const [selectedUser, setSelectedUser] = useState<UiUser | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const runSearch = async () => {
        setIsLoading(true);
        setLoadError("");
        try {
            const searchResult = await searchUsers({
                keyword,
                area: location,
                occupation: industry,
            });
            setUsers(searchResult);

            // Seed friendship status for each returned user in parallel
            if (searchResult.length > 0) {
                setStatusLoading(true);
                const statuses = await Promise.allSettled(
                    searchResult.map((u) => getFriendStatus(u.id))
                );
                const seeded: Record<string, "idle" | "sending" | "sent" | "error" | "friend"> = {};
                searchResult.forEach((u, i) => {
                    const result = statuses[i];
                    if (result.status === "fulfilled") {
                        const s = result.value.status;
                        if (s === "friend") seeded[u.id] = "friend";
                        else if (s === "sent") seeded[u.id] = "sent";
                        // "received", "none", "self" → idle (show add button or nothing)
                        else seeded[u.id] = "idle";
                    }
                });
                setRequestStates(seeded);
                setStatusLoading(false);
            }
        } catch {
            setLoadError("ユーザー検索に失敗しました。しばらくしてから再試行してください。");
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        runSearch();
    }, []);

    const openFriendModal = (user: UiUser) => {
        setSelectedUser(user);
        setFriendModalOpen(true);
    };

    const handleSendRequest = async () => {
        if (!selectedUser) return;

        const userId = selectedUser.id;
        setFriendModalOpen(false);
        setRequestStates((prev) => ({ ...prev, [userId]: "sending" }));

        try {
            await sendFriendRequest(userId);
            setRequestStates((prev) => ({ ...prev, [userId]: "sent" }));
        } catch {
            setRequestStates((prev) => ({ ...prev, [userId]: "error" }));
        }
    };

    const getButtonLabel = (userId: string) => {
        const state = requestStates[userId];
        if (state === "sending") return null; // shows spinner
        if (state === "sent") return t("friend_requested");
        if (state === "error") return t("retry");
        return t("add_friend");
    };

    const getButtonVariant = (userId: string): "outline" | "default" | "destructive" => {
        if (requestStates[userId] === "error") return "destructive";
        return "outline";
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Logo />
                                <nav className="hidden md:flex items-center gap-6">
                                    <Link to="/user/home" className="text-gray-600 hover:text-gray-900">{t("nav_home")}</Link>
                                    <Link to="/user/search" className="text-blue-600 font-medium">{t("nav_search")}</Link>
                                    <Link to="/user/friends" className="text-gray-600 hover:text-gray-900">{t("nav_friends")}</Link>
                                    <Link to="/user/events" className="text-gray-600 hover:text-gray-900">{t("nav_events")}</Link>
                                    <Link to="/user/mypage" className="text-gray-600 hover:text-gray-900">{t("nav_mypage")}</Link>
                                </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <HeaderActions />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">{t("user_search_title")}</h1>
                    <p className="text-gray-600">{t("user_search_subtitle")}</p>
                </div>

                {/* Search Filters */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>{t("search_filters")}</CardTitle>
                        <CardDescription>{t("search_filters_desc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-2">
                                <Label htmlFor="keyword">{t("keyword")}</Label>
                                <Input
                                    id="keyword"
                                    placeholder={t("placeholder_keyword")}
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">{t("label_location")}</Label>
                                <Input
                                    id="location"
                                    placeholder={t("placeholder_location")}
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="industry">{t("label_industry")}</Label>
                                <Input
                                    id="industry"
                                    placeholder={t("placeholder_industry")}
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button className="w-full md:w-auto" onClick={runSearch} disabled={isLoading}>
                            <Search className="mr-2 h-4 w-4" />
                            {isLoading ? t("searching") : t("search")}
                        </Button>
                    </CardContent>
                </Card>

                {/* Search Results */}
                <Card>
                    <CardHeader>
                        <CardTitle>検索結果</CardTitle>
                        <CardDescription>{users.length}人のユーザーが見つかりました</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadError && <p className="text-sm text-red-600 mb-4">{loadError}</p>}
                        <div className="space-y-4">
                            {users.map((user) => {
                                const state = requestStates[user.id];
                                const isFriend = state === "friend";
                                const isSending = state === "sending";
                                const isSent = state === "sent";
                                const isStatusPending = statusLoading && state === undefined;

                                return (
                                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex gap-4">
                                                <Avatar className="h-20 w-20 flex-shrink-0">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xl font-semibold mb-1">{user.name}</h3>
                                                    <div className="flex flex-wrap gap-3 mb-2 text-sm text-gray-600">
                                                        <div className="flex items-center gap-1">
                                                            <Briefcase className="h-4 w-4" />
                                                            <span>{user.role}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="h-4 w-4" />
                                                            <span>{user.location}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mb-1">
                                                        <span className="font-medium">業界: </span>
                                                        {user.industry}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mb-4">{user.intro}</p>
                                                    <div className="flex gap-2 items-center">
                                                        <Button asChild size="sm">
                                                            <Link to={`/user/profile/${user.id}`}>
                                                                {t("view_profile")}
                                                            </Link>
                                                        </Button>

                                                        {/* Show spinner while status is being fetched */}
                                                        {isStatusPending && (
                                                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                                        )}

                                                        {/* Already friends – no add button */}
                                                        {!isStatusPending && isFriend && (
                                                            <span className="inline-flex items-center gap-1 text-sm text-green-700 font-medium">
                                                                <Check className="h-4 w-4" />
                                                                フレンド
                                                            </span>
                                                        )}

                                                        {/* Add / sent / retry button */}
                                                        {!isStatusPending && !isFriend && (
                                                            <Button
                                                                variant={getButtonVariant(user.id)}
                                                                size="sm"
                                                                disabled={isSending || isSent}
                                                                onClick={() => openFriendModal(user)}
                                                            >
                                                                {isSending ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : isSent ? (
                                                                    <>
                                                                        <Check className="mr-1 h-4 w-4" />
                                                                        {getButtonLabel(user.id)}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UserPlus className="mr-1 h-4 w-4" />
                                                                        {getButtonLabel(user.id)}
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {requestStates[user.id] === "error" && (
                                                        <p className="text-xs text-red-600 mt-1">
                                                            {t("friend_request_failed")}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            {!isLoading && users.length === 0 && !loadError && (
                                <p className="text-sm text-gray-600">条件に一致するユーザーが見つかりませんでした。</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Friend Request Confirmation Modal */}
            <Dialog open={friendModalOpen} onOpenChange={setFriendModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("confirm_send_friend_request")}</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">{selectedUser.name}</span> {t("will_send_friend_request")}
                        </p>
                    )}
                    <DialogFooter>
                        <Button onClick={handleSendRequest}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            {t("send")}
                        </Button>
                        <Button variant="outline" onClick={() => setFriendModalOpen(false)}>
                            {t("cancel")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
