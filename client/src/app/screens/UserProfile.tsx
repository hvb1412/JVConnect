import { Link, useParams } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { useTranslation } from "../lib/i18n";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
    ArrowLeft,
    MapPin,
    Briefcase,
    MessageCircle,
    Loader2,
    UserCheck,
    UserPlus,
    Flag,
    CheckCircle2,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { useEffect, useState } from "react";
import {
    getUserProfile,
    getFriendStatus,
    sendFriendRequest,
    submitUserReport,
    type UiUser,
    type FriendStatus,
} from "../lib/userApi";

const REPORT_TYPES = ["harassment", "inappropriate", "fake", "spam", "violence", "other"] as const;

export function UserProfile() {
    const { t } = useTranslation();
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

    // ── Report dialog state ───────────────────────────────────────────────
    const [reportOpen, setReportOpen] = useState(false);
    const [reportType, setReportType] = useState(REPORT_TYPES[0].value);
    const [reportDetail, setReportDetail] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSuccess, setReportSuccess] = useState(false);

    // Friend request dialog
    const [friendOpen, setFriendOpen] = useState(false);

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
            setLoadError(t("profile_load_failed"));
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
            // Silently fail
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
            setRequestError(t("friend_request_failed"));
        } finally {
            setRequestSending(false);
        }
    };

    const handleOpenReport = () => {
        setReportType(REPORT_TYPES[0].value);
        setReportDetail("");
        setReportError("");
        setReportSuccess(false);
        setReportOpen(true);
    };

    const handleSubmitReport = async () => {
        if (!id) return;
        setReportSubmitting(true);
        setReportError("");
        try {
            await submitUserReport({
                userId: id,
                reportType,
                reason: t(`report_type_${reportType}`) || reportType,
                detail: reportDetail.trim(),
            });
            setReportSuccess(true);
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                t("report_send_failed");
            setReportError(msg);
        } finally {
            setReportSubmitting(false);
        }
    };

    const isFriend = friendStatus === "friend";
    const hasSent = friendStatus === "sent";
    const hasReceived = friendStatus === "received";

    const friendButtonLabel = () => {
        if (requestSending || statusLoading) return null;
        if (isFriend) return t("friend_label");
        if (hasSent) return t("friend_requested");
        if (hasReceived) return t("friend_accept");
        return t("add_friend");
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
                                    <Link to="/user/home" className="text-gray-600 hover:text-gray-900">{t("nav_home")}</Link>
                                    <Link to="/user/search" className="text-gray-600 hover:text-gray-900">{t("nav_search")}</Link>
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
            <div className="max-w-5xl mx-auto px-6 py-8">
                <Button asChild variant="ghost" className="mb-6">
                    <Link to="/user/search">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t("back")}
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
                                    {/* Chat button */}
                                    <Button asChild className="w-full" disabled={!isFriend}>
                                        <Link to={`/user/chat/${userId}`}>
                                            <MessageCircle className="mr-2 h-4 w-4" />
                                            {t("chat")}
                                        </Link>
                                    </Button>

                                    {/* Friend action button */}
                                    {friendStatus !== "self" && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            disabled={isFriend || hasSent || requestSending || statusLoading}
                                            onClick={() => {
                                                if (hasReceived) {
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

                                    {requestError && (
                                        <p className="text-xs text-red-600">{requestError}</p>
                                    )}

                                    {/* Report button — hide for self */}
                                    {friendStatus !== "self" && (
                                        <Button
                                            variant="outline"
                                            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={handleOpenReport}
                                        >
                                            <Flag className="mr-2 h-4 w-4" />
                                            {t("report_user")}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column – Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4">{t("profile_intro_title")}</h2>
                                {isLoading && (
                                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">{t("loading")}</span>
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

            {/* ── Report Dialog ─────────────────────────────────────────────────── */}
            <Dialog open={reportOpen} onOpenChange={(open) => {
                if (!open && !reportSubmitting) {
                    setReportOpen(false);
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Flag className="h-5 w-5 text-red-500" />
                            {t("report_user_title")}
                        </DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            <span className="font-medium text-gray-800">{userName}</span> {t("report_user_notice")}
                        </p>
                    </DialogHeader>

                    {reportSuccess ? (
                        /* ── Success state ── */
                        <div className="py-6 flex flex-col items-center gap-3 text-center">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="font-semibold text-gray-800">通報を受け付けました</p>
                            <p className="text-sm text-gray-500">
                                管理者が内容を確認し、適切な対応を取ります。<br />
                                ご協力ありがとうございます。
                            </p>
                            <Button className="mt-2 w-full" onClick={() => setReportOpen(false)}>
                                閉じる
                            </Button>
                        </div>
                    ) : (
                        /* ── Form state ── */
                        <>
                            <div className="space-y-4">
                                {/* Report type selector */}
                                <div className="space-y-1.5">
                                        <Label htmlFor="report-type">{t("report_type_label")} <span className="text-red-500">*</span></Label>
                                        <select
                                        id="report-type"
                                        className="w-full border border-gray-200 rounded-md h-10 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={reportType}
                                        onChange={(e) => setReportType(e.target.value)}
                                    >
                                            {REPORT_TYPES.map((v) => (
                                                <option key={v} value={v}>{t(`report_type_${v}`)}</option>
                                            ))}
                                    </select>
                                </div>

                                {/* Detail textarea */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="report-detail">
                                        {t("report_detail_label")} <span className="text-gray-400 font-normal text-xs">({t("optional")})</span>
                                    </Label>
                                    <Textarea
                                        id="report-detail"
                                        placeholder={t("report_detail_placeholder")}
                                        value={reportDetail}
                                        onChange={(e) => setReportDetail(e.target.value)}
                                        className="resize-none"
                                        rows={4}
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-gray-400 text-right">{reportDetail.length}/500</p>
                                </div>

                                {/* Error message */}
                                {reportError && (
                                    <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
                                        <p className="text-sm text-red-700">{reportError}</p>
                                    </div>
                                )}

                                {/* Notice */}
                                <p className="text-xs text-gray-400 leading-relaxed">{t("false_report_warning")}</p>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setReportOpen(false)} disabled={reportSubmitting}>{t("cancel")}</Button>
                                <Button variant="destructive" onClick={handleSubmitReport} disabled={reportSubmitting}>
                                    {reportSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("sending")}</>) : (<><Flag className="mr-2 h-4 w-4" />{t("report_user")}</>)}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Friend Request Confirmation Dialog ───────────────────────────── */}
            <Dialog open={friendOpen} onOpenChange={setFriendOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("confirm_send_friend_request")}</DialogTitle>
                    </DialogHeader>
                    {user && (
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">{user.name}</span> {t("will_send_friend_request")}
                        </p>
                    )}
                    <DialogFooter>
                        <Button onClick={handleSendRequest} disabled={requestSending}>{requestSending ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<UserPlus className="mr-2 h-4 w-4" />)}{t("send")}</Button>
                        <Button variant="outline" onClick={() => setFriendOpen(false)}>{t("cancel")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
