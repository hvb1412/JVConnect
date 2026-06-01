import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { useTranslation } from "../lib/i18n";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import { Edit, Pencil } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    getUserProfile,
    updateUserProfile,
    changeUserPassword,
    requestChangePasswordOtp,
    deleteUserAccount,
} from "../lib/userApi";
import { logout } from "../lib/authApi";
import { LogOut } from "lucide-react";
import { uploadImageByUrl } from "../lib/uploadApi";
import { toast } from "sonner";

export function UserMyPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const userId = localStorage.getItem("userId") || "";
    const [name, setName] = useState("山田太郎");
    const [avatar, setAvatar] = useState("");
    const [avatarError, setAvatarError] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [area, setArea] = useState("");
    const [industry, setIndustry] = useState("");
    const [bio, setBio] = useState("");
    const [memberSince, setMemberSince] = useState("2024年1月");
    const [connections, setConnections] = useState(0);
    const [eventsAttended, setEventsAttended] = useState(0);
    const [needsProfileUpdate, setNeedsProfileUpdate] = useState(false);
    const [editing, setEditing] = useState(false);

    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [otpDialogOpen, setOtpDialogOpen] = useState(false);
    const [otp, setOtp] = useState("");
    const [isRequestingOtp, setIsRequestingOtp] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const user = {
        avatar: "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMGF2YXRhciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDg5MjI0NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    };
    useEffect(() => {
        const loadProfile = async () => {
            try {
                if (!userId) return;

                        const profile = await getUserProfile(userId);

                setName(profile.name);
                setAvatar(profile.avatar);
                setArea(profile.location);
                setIndustry(profile.role);
                setBio(profile.intro);
                setMemberSince(profile.memberSince ?? "未登録");
                setConnections(profile.connections ?? 0);
                setEventsAttended(profile.eventsAttended ?? 0);
                setNeedsProfileUpdate(profile.needsProfileUpdate ?? false);
            } catch (error) {
                console.error(error);
            }
        };

        loadProfile();
    }, [userId]);
    const handleSaveProfile = async () => {
        try {
            setSaving(true);

            await updateUserProfile({
                name: name,
                avatarURL: avatar,
                area: area,
                occupation: industry,
                introduction: bio,
            });

            setEditing(false);
            setNeedsProfileUpdate(false);
            toast.success(t("profile_updated"));
        } catch (error) {
            console.error(error);
            toast.error(t("profile_save_failed"));
        } finally {
            setSaving(false);
        }
    };

    const handleSelectAvatar = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
            setAvatarError(t("avatar_size_limit"));
            return;
        }

        setAvatarError("");
        setIsUploading(true);
        setSaving(true);

        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ""));
                reader.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
                reader.readAsDataURL(file);
            });

            const result = await uploadImageByUrl(dataUrl);
            await updateUserProfile({ avatarURL: result.secure_url });
            setAvatar(result.secure_url);
            toast.success(t("avatar_updated"));
        } catch (error: any) {
            setAvatarError(error?.message || t("avatar_upload_failed"));
            toast.error(t("avatar_upload_failed"));
        } finally {
            setIsUploading(false);
            setSaving(false);
        }
    };

    const handleRequestOtp = async () => {
        if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
            toast.error(t("check_input_error"));
            return;
        }

        if (newPassword.length < 8) {
            toast.error(t("new_password_length_error"));
            return;
        }

        setIsRequestingOtp(true);
        try {
            await requestChangePasswordOtp(currentPassword);
            toast.success(t("otp_sent_success"));
            setPasswordDialogOpen(false);
            setOtpDialogOpen(true);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || t("error_occurred"));
        } finally {
            setIsRequestingOtp(false);
        }
    };

    const handleVerifyAndChangePassword = async () => {
        if (!otp) {
            toast.error(t("otp_enter_required"));
            return;
        }

        setIsChangingPassword(true);
        try {
            await changeUserPassword(currentPassword, newPassword, otp);
            toast.success(t("password_change_success"));
            setOtpDialogOpen(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setOtp("");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || t("password_change_failed"));
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeletingAccount(true);

        try {
            await deleteUserAccount();
            logout();
            localStorage.removeItem("userId");
            localStorage.removeItem("role");
            toast.success(t("account_deleted"));
            navigate("/guest/login");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || t("account_delete_failed"));
        } finally {
            setIsDeletingAccount(false);
        }
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
                            <Link to="/user/search" className="text-gray-600 hover:text-gray-900">{t("nav_search")}</Link>
                            <Link to="/user/friends" className="text-gray-600 hover:text-gray-900">{t("nav_friends")}</Link>
                            <Link to="/user/events" className="text-gray-600 hover:text-gray-900">{t("nav_events")}</Link>
                            <Link to="/user/mypage" className="text-blue-600 font-medium">{t("nav_mypage")}</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <HeaderActions />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">{t("mypage_title")}</h1>
                    <p className="text-gray-600">{t("manage_profile_info")}</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Profile Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardContent className="p-6 text-center">
                                <div className="relative mx-auto mb-4 w-32">
                                    <Avatar className="h-32 w-32">
                                        <AvatarImage src={avatar || user.avatar} />
                                        <AvatarFallback className="text-2xl">
                                            {name ? name[0] : "山"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <input
                                        ref={fileInputRef}
                                        id="avatar"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSelectAvatar}
                                        className="absolute bottom-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white bg-blue-600 text-white shadow hover:bg-blue-700"
                                        aria-label="プロフィール画像を変更"
                                        disabled={isUploading}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </div>
                                {avatarError && (
                                    <p className="mb-2 text-xs text-red-600">{avatarError}</p>
                                )}
                                <h2 className="text-xl font-bold mb-1">
                                    {name}
                                </h2>
                                <p className="text-gray-600 mb-4">{industry}</p>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t("member_since_label")}</span>
                                        <span className="font-medium">
                                            {memberSince}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t("connections_label")}</span>
                                        <span className="font-medium">
                                            {connections}人
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t("events_attended_label")}</span>
                                        <span className="font-medium">
                                            {eventsAttended}回
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Edit Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("edit_profile")}</CardTitle>
                                <CardDescription>{t("edit_profile_desc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t("name")}</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={t("placeholder_name")}
                                        disabled={!editing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="area">{t("label_area")}</Label>
                                    <Input
                                        id="area"
                                        value={area}
                                        onChange={(e) => setArea(e.target.value)}
                                        placeholder={t("placeholder_area")}
                                        disabled={!editing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="industry">{t("label_industry")}</Label>
                                    <Input
                                        id="industry"
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        placeholder={t("placeholder_industry")}
                                        disabled={!editing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio">{t("label_intro")}</Label>
                                    <Textarea
                                        id="bio"
                                        rows={4}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder={t("placeholder_bio")}
                                        disabled={!editing}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1"
                                        variant="outline"
                                        onClick={() => setEditing(true)}
                                        disabled={editing}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        {t("edit")}
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={handleSaveProfile}
                                        disabled={!editing || saving || isUploading}
                                    >
                                        {saving ? t("saving") : t("save")}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings")}</CardTitle>
                                <CardDescription>{t("password_account_management")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4">
                                    <div>
                                        <p className="font-medium">{t("change_password")}</p>
                                        <p className="text-sm text-gray-600">{t("change_password_desc")}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setPasswordDialogOpen(true)
                                        }
                                    >
                                        {t("change")}
                                    </Button>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4">
                                    <div>
                                        <p className="font-medium text-red-800">{t("delete_account")}</p>
                                        <p className="text-sm text-gray-600">{t("delete_account_warning")}</p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            setDeleteDialogOpen(true)
                                        }
                                    >
                                        {t("delete")}
                                    </Button>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4">
                                    <div>
                                        <p className="font-medium">{t("logout")}</p>
                                        <p className="text-sm text-gray-600">{t("logout_description")}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            logout();
                                            navigate("/guest/login");
                                        }}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        {t("logout")}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog
                open={passwordDialogOpen}
                onOpenChange={setPasswordDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("change_password")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="current-pw">現在のパスワード</Label>
                            <Input
                                id="current-pw"
                                type="password"
                                value={currentPassword}
                                onChange={(e) =>
                                    setCurrentPassword(e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-pw">新しいパスワード</Label>
                            <Input
                                id="new-pw"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-pw">
                                新しいパスワード（確認）
                            </Label>
                            <Input
                                id="confirm-pw"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                            <Button disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || isRequestingOtp} onClick={handleRequestOtp}>
                                {isRequestingOtp ? t("processing") : t("change_action")}
                            </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPasswordDialogOpen(false)}
                        >
                            {t("cancel")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={otpDialogOpen}
                onOpenChange={setOtpDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("enter_otp_code")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <p className="text-sm text-gray-600">{t("otp_sent_notice")}</p>
                        <div className="space-y-2">
                            <Label htmlFor="otp-code">確認コード</Label>
                            <Input
                                id="otp-code"
                                type="text"
                                placeholder={t("otp_placeholder")}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button disabled={!otp || isChangingPassword} onClick={handleVerifyAndChangePassword}>{isChangingPassword ? t("changing") : t("verify_and_change")}</Button>
                        <Button
                            variant="outline"
                            onClick={() => setOtpDialogOpen(false)}
                        >
                            {t("cancel")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("confirm_delete_account")}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-600">{t("confirm_delete_account_desc")}</p>
                    <DialogFooter>
                        <Button
                            variant="destructive"
                            disabled={isDeletingAccount}
                            onClick={handleDeleteAccount}
                        >
                            {isDeletingAccount ? t("deleting") : t("delete_confirm")}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            {t("cancel")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={needsProfileUpdate} onOpenChange={setNeedsProfileUpdate}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>プロフィールを更新してください</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-600">
                        新規登録されたアカウントのため、プロフィール情報を入力するとサービスが使いやすくなります。
                    </p>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setNeedsProfileUpdate(false)}
                        >
                            あとで
                        </Button>
                        <Button
                            onClick={() => {
                                setEditing(true);
                                setNeedsProfileUpdate(false);
                            }}
                        >
                            プロフィールを編集する
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
