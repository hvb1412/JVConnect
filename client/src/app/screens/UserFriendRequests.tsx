import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { useTranslation } from "../lib/i18n";
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
    const { t } = useTranslation();
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
            setError(t("friend_requests_load_failed"));
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
            setError(t("friend_accept_failed"));
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
            setError(t("friend_reject_failed"));
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
                            <Link to="/user/home">{t("nav_home")}</Link>
                            <Link to="/user/search">{t("nav_search")}</Link>
                            <Link to="/user/friends" className="text-blue-600 font-medium">{t("nav_friends")}</Link>
                            <Link to="/user/events">{t("nav_events")}</Link>
                            <Link to="/user/mypage">{t("nav_mypage")}</Link>
                        </nav>
                    </div>
                    <HeaderActions />
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{t("friend_requests_title")}</h1>
                        <p className="text-gray-600 text-sm mt-1">{t("manage_incoming_requests")}</p>
                    </div>
                    <Button asChild variant="outline">
                        <Link to="/user/friends">← {t("friends_list_title")}</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {t("friend_requests")}
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
                                <span>{t("loading")}</span>
                            </div>
                        ) : requests.length === 0 ? (
                            /* Empty state */
                            <div className="flex flex-col items-center gap-3 py-10 text-gray-400">
                                <InboxIcon className="h-10 w-10" />
                                <p className="text-sm">{t("no_friend_requests")}</p>
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
                                                        {t("accept")}
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
                                                        {t("reject")}
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
