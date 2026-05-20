import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
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
    deleteUserAccount,
} from "../lib/userApi";
import { logout } from "../lib/authApi";
import { LogOut } from "lucide-react";
import { uploadImageByUrl } from "../lib/uploadApi";
import { toast } from "sonner";

export function UserMyPage() {
    const navigate = useNavigate();
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

            alert("プロフィールを更新しました");
        } catch (error) {
            console.error(error);
            alert("更新に失敗しました");
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
            setAvatarError("ファイルサイズは5MB以内にしてください。");
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
            toast.success("プロフィール画像を更新しました。");
        } catch (error: any) {
            setAvatarError(error?.message || "アップロードに失敗しました。");
            toast.error("アップロードに失敗しました。");
        } finally {
            setIsUploading(false);
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
            toast.error("入力を確認してください。");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("新しいパスワードは8文字以上である必要があります。");
            return;
        }

        setIsChangingPassword(true);

        try {
            await changeUserPassword(currentPassword, newPassword);
            toast.success("パスワードを変更しました。");
            setPasswordDialogOpen(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || "パスワードの変更に失敗しました。");
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
            toast.success("アカウントを削除しました。");
            navigate("/guest/login");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || "アカウント削除に失敗しました。");
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
                                className="text-blue-600 font-medium"
                            >
                                マイページ
                            </Link>
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
                    <h1 className="text-3xl font-bold mb-2">マイページ</h1>
                    <p className="text-gray-600">プロフィール情報を管理する</p>
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
                                        <span className="text-gray-600">
                                            メンバー歴
                                        </span>
                                        <span className="font-medium">
                                            {memberSince}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            つながり
                                        </span>
                                        <span className="font-medium">
                                            {connections}人
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            参加イベント
                                        </span>
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
                                <CardTitle>プロフィール編集</CardTitle>
                                <CardDescription>
                                    地域・業界・自己紹介を編集
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">名前</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="名前を入力"
                                        disabled={!editing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="area">地域</Label>
                                    <Input
                                        id="area"
                                        value={area}
                                        onChange={(e) => setArea(e.target.value)}
                                        placeholder="地域を入力"
                                        disabled={!editing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="industry">業界</Label>
                                    <Input
                                        id="industry"
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        placeholder="業界を入力"
                                        disabled={!editing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio">自己紹介</Label>
                                    <Textarea
                                        id="bio"
                                        rows={4}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="あなたについて簡単に紹介してください..."
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
                                        編集
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={handleSaveProfile}
                                        disabled={!editing || saving || isUploading}
                                    >
                                        {saving ? "保存中..." : "保存"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>設定</CardTitle>
                                <CardDescription>
                                    パスワードとアカウントの管理
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4">
                                    <div>
                                        <p className="font-medium">
                                            パスワード変更
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            ログインパスワードを更新します
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setPasswordDialogOpen(true)
                                        }
                                    >
                                        変更
                                    </Button>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4">
                                    <div>
                                        <p className="font-medium text-red-800">
                                            アカウント削除
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            すべてのデータが削除されます
                                        </p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            setDeleteDialogOpen(true)
                                        }
                                    >
                                        削除
                                    </Button>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4">
                                    <div>
                                        <p className="font-medium">
                                            ログアウト
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            現在のアカウントからログアウトします
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            logout();
                                            navigate("/guest/login");
                                        }}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        ログアウト
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
                        <DialogTitle>パスワード変更</DialogTitle>
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
                        <Button
                            disabled={
                                !currentPassword ||
                                !newPassword ||
                                newPassword !== confirmPassword ||
                                isChangingPassword
                            }
                            onClick={handleChangePassword}
                        >
                            {isChangingPassword ? "変更中..." : "変更する"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPasswordDialogOpen(false)}
                        >
                            キャンセル
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>アカウントを削除しますか？</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-600">
                        この操作は取り消せません。プロフィール、フレンド、チャット履歴などがすべて削除されます。
                    </p>
                    <DialogFooter>
                        <Button
                            variant="destructive"
                            disabled={isDeletingAccount}
                            onClick={handleDeleteAccount}
                        >
                            {isDeletingAccount ? "削除中..." : "削除する"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            キャンセル
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
