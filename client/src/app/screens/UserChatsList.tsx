import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { useTranslation } from "../lib/i18n";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../components/ui/dialog";
import { ArrowLeft, MessageCircle, MessageCircleWarning, Users, Plus, Check } from "lucide-react";
import {
    getConversations,
    getPendingConversations,
    UiConversation,
    createGroupChat,
    BackendUser,
} from "../lib/conversationApi";
import { initSocket } from "../lib/socket";
import { getFriendList } from "../lib/userApi";

type Tab = "chats" | "requests";

export function UserChatsList() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [tab, setTab] = useState<Tab>("chats");
    const [chats, setChats] = useState<UiConversation[]>([]);
    const [pendingChats, setPendingChats] = useState<UiConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Create group dialog
    const [showGroupDialog, setShowGroupDialog] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [friends, setFriends] = useState<BackendUser[]>([]);
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [groupError, setGroupError] = useState("");

    const currentUserId = localStorage.getItem("userId") || "";
    const isAdmin = localStorage.getItem("role") === "admin";
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

    // Load friends for group creation dialog
    const loadFriends = async () => {
        try {
            const data = await getFriendList();
            // getFriendList returns FriendshipData[] with { friendshipId, friend: UiUser }
            setFriends(Array.isArray(data) ? data.map((item: any) => ({
                _id: item.friend?.id || item.friend?._id,
                name: item.friend?.name || "",
                email: item.friend?.email || "",
                avatarURL: item.friend?.avatar || item.friend?.avatarURL || "",
            })) : []);
        } catch {
            setFriends([]);
        }
    };

    const openGroupDialog = () => {
        setGroupName("");
        setSelectedFriendIds([]);
        setGroupError("");
        setShowGroupDialog(true);
        loadFriends();
    };

    const toggleFriend = (friendId: string) => {
        setSelectedFriendIds((prev) =>
            prev.includes(friendId)
                ? prev.filter((id) => id !== friendId)
                : [...prev, friendId]
        );
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            setGroupError(t("group_name_required"));
            return;
        }
        if (selectedFriendIds.length === 0) {
            setGroupError(t("group_members_required"));
            return;
        }

        setCreatingGroup(true);
        setGroupError("");
        try {
            const result = await createGroupChat(groupName.trim(), selectedFriendIds);
            setShowGroupDialog(false);
            navigate(`/user/chat/${result.conversationId}`);
        } catch (error: any) {
            setGroupError(error?.message || t("group_create_failed"));
        } finally {
            setCreatingGroup(false);
        }
    };

    // Realtime: listen for new message_request events to update pending badge
    useEffect(() => {
        if (!currentUserId) return;
        const socket = initSocket(currentUserId);
        if (!socket) return;

        const handleMessageRequest = () => {
            getPendingConversations().then(setPendingChats).catch(() => { });
        };

        const handleNewMessage = () => {
            // Refresh conversation list to update last message
            getConversations().then(setChats).catch(() => { });
        };

        const handleParticipationApproved = () => {
            // Refresh conversation list when added to an event group chat
            getConversations().then(setChats).catch(() => { });
        };

        const handleGroupChatUpdated = () => {
            getConversations().then(setChats).catch(() => { });
        };

        socket.on("message_request", handleMessageRequest);
        socket.on("receive_message", handleNewMessage);
        socket.on("participation_approved", handleParticipationApproved);
        socket.on("group_chat_updated", handleGroupChatUpdated);

        return () => {
            socket.off("message_request", handleMessageRequest);
            socket.off("receive_message", handleNewMessage);
            socket.off("participation_approved", handleParticipationApproved);
            socket.off("group_chat_updated", handleGroupChatUpdated);
        };
    }, [currentUserId]);

    const displayList = tab === "chats" ? chats : pendingChats;

    return (
        <div className="min-h-screen bg-gray-50">
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
                                <Link to="/user/home" className="text-blue-600 font-medium">{t("nav_home")}</Link>
                                <Link to="/user/search" className="text-gray-600 hover:text-gray-900">{t("nav_search")}</Link>
                                <Link to="/user/friends" className="text-gray-600 hover:text-gray-900">{t("nav_friends")}</Link>
                                <Link to="/user/events" className="text-gray-600 hover:text-gray-900">{t("nav_events")}</Link>
                                <Link to="/user/mypage" className="text-gray-600 hover:text-gray-900">{t("nav_mypage")}</Link>
                            </nav>
                        )}
                    </div>
                    <HeaderActions />
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <Button asChild variant="ghost">
                        <Link to={isAdmin ? "/admin/dashboard" : "/user/home"}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t("back")}
                        </Link>
                    </Button>
                    {!isAdmin && (
                        <Button size="sm" onClick={openGroupDialog} className="flex items-center gap-1.5">
                            <Plus className="h-4 w-4" />
                            {t("create_group")}
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader className="pb-0">
                        <CardTitle className="flex items-center gap-2 mb-4">
                            <MessageCircle className="h-5 w-5" />
                            {t("messages_title")}
                        </CardTitle>

                        {/* ── Tabs ── */}
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setTab("chats")}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === "chats"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                <MessageCircle className="h-4 w-4" />
                                {t("tab_chats")}
                                {chats.reduce((acc, c) => acc + c.unread, 0) > 0 && (
                                    <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                                        {chats.reduce((acc, c) => acc + c.unread, 0)}
                                    </Badge>
                                )}
                            </button>
                            {!isAdmin && (
                                <button
                                    onClick={() => setTab("requests")}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === "requests"
                                            ? "border-amber-500 text-amber-600"
                                            : "border-transparent text-gray-500 hover:text-gray-800"
                                        }`}
                                >
                                    <MessageCircleWarning className="h-4 w-4" />
                                    {t("message_request")}
                                    {pendingChats.length > 0 && (
                                        <Badge className="text-xs px-1.5 py-0.5 min-w-[20px] text-center bg-amber-500 hover:bg-amber-500">
                                            {pendingChats.length}
                                        </Badge>
                                    )}
                                </button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-2 space-y-1">
                        {loading && (
                            <div className="p-6 text-center text-sm text-gray-500">{t("loading")}</div>
                        )}
                        {loadError && (
                            <div className="p-6 text-center text-sm text-red-600">{loadError}</div>
                        )}

                        {/* Empty states */}
                        {!loading && !loadError && displayList.length === 0 && (
                            <div className="p-8 text-center">
                                {tab === "chats" ? (
                                    <>
                                        <MessageCircle className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm font-medium text-gray-600">{t("no_chats")}</p>
                                        <p className="text-xs text-gray-400 mt-1">{t("start_chat_with_friends")}</p>
                                    </>
                                ) : (
                                    <>
                                        <MessageCircleWarning className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm font-medium text-gray-600">{t("no_message_requests")}</p>
                                        <p className="text-xs text-gray-400 mt-1">{t("new_requests_will_appear_here")}</p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Conversation list */}
                        {!loading && !loadError && displayList.map((chat) => (
                            <Link
                                key={chat.id}
                                to={`/user/chat/${chat.id}`}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors border ${tab === "requests"
                                        ? "border-amber-100 bg-amber-50 hover:bg-amber-100 hover:border-amber-200"
                                        : "border-transparent hover:bg-gray-100 hover:border-gray-200"
                                    }`}
                            >
                                <div className="relative">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={chat.avatar} />
                                        <AvatarFallback>{chat.name[0]}</AvatarFallback>
                                    </Avatar>
                                    {chat.type === "group" && (
                                        <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                                            <Users className="h-3 w-3 text-white" />
                                        </span>
                                    )}
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
                                            {chat.type === "group" && !chat.eventId && (
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-0 text-xs px-1.5">
                                                    {t("group_label")}
                                                </Badge>
                                            )}
                                            {chat.type === "group" && chat.eventId && (
                                                <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-0 text-xs px-1.5">
                                                    {t("event_group")}
                                                </Badge>
                                            )}
                                            {tab === "requests" && (
                                                <Badge className="bg-amber-100 text-amber-800 border-0 text-xs px-1.5">{t("request_label")}</Badge>
                                            )}
                                            {tab === "chats" && chat.unread > 0 && (
                                                <Badge variant="destructive" className="shrink-0">{chat.unread}</Badge>
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

            {/* ── Create Group Dialog ── */}
            <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {t("create_group")}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                {t("group_name_label")}
                            </label>
                            <Input
                                placeholder={t("group_name_placeholder")}
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                {t("select_members")} ({selectedFriendIds.length} {t("selected")})
                            </label>
                            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto divide-y divide-gray-100">
                                {friends.length === 0 ? (
                                    <p className="p-4 text-sm text-gray-500 text-center">{t("no_friends")}</p>
                                ) : (
                                    friends.map((friend: any) => {
                                        const isSelected = selectedFriendIds.includes(friend._id || friend.id);
                                        const fid = friend._id || friend.id;
                                        return (
                                            <button
                                                key={fid}
                                                type="button"
                                                className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                                                    }`}
                                                onClick={() => toggleFriend(fid)}
                                            >
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={friend.avatarURL} />
                                                    <AvatarFallback>{friend.name?.[0] || "?"}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{friend.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{friend.email}</p>
                                                </div>
                                                {isSelected && (
                                                    <span className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <Check className="h-3 w-3 text-white" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {groupError && (
                            <p className="text-sm text-red-600">{groupError}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={handleCreateGroup}
                            disabled={creatingGroup || !groupName.trim() || selectedFriendIds.length === 0}
                        >
                            {creatingGroup ? t("creating") : t("create_group")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
