import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Logo } from "../components/Logo";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AlertTriangle, Clock, LogOut } from "lucide-react";
import axios from "axios";

type BanInfo = {
    isRestricted: boolean;
    restrictedUntil: string | null;
    latestBanDate: string | null;
};

async function fetchBanInfo(): Promise<BanInfo | null> {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const apiBase = import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.startsWith("http")
                ? import.meta.env.VITE_API_URL
                : `https://${import.meta.env.VITE_API_URL}`
            : "http://localhost:3000";
        const res = await axios.get(`${apiBase}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data?.data;
        return {
            isRestricted: data?.isRestricted ?? false,
            restrictedUntil: data?.restrictedUntil ?? null,
            latestBanDate: data?.latestBanDate ?? null,
        };
    } catch {
        return null;
    }
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return "無期限";
    return new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(dateStr));
}

function calcRemainingDays(until: string | null) {
    if (!until) return null;
    const diff = new Date(until).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function UserReportRestricted() {
    const navigate = useNavigate();
    const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBanInfo().then((info) => {
            setBanInfo(info);
            setLoading(false);

            // もし制限が解除されていたらホームへ
            if (info && !info.isRestricted) {
                navigate("/user/home", { replace: true });
            }
        });
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        navigate("/guest/login", { replace: true });
    };

    const remaining = banInfo?.restrictedUntil ? calcRemainingDays(banInfo.restrictedUntil) : null;
    const isPermanent = banInfo?.isRestricted && !banInfo.restrictedUntil;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Logo />
                    <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        ログアウト
                    </Button>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-6 py-16">
                <Card className="border-red-200 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-red-600 text-xl">
                            <AlertTriangle className="h-6 w-6" />
                            アカウント利用制限中
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <p className="text-gray-700 leading-relaxed">
                            通報の審査結果により、あなたのアカウントは現在利用制限されています。
                            制限期間中はチャット・イベント参加などの機能をご利用いただけません。
                        </p>

                        {loading ? (
                            <div className="rounded-md bg-red-50 border border-red-200 p-4 animate-pulse h-24" />
                        ) : (
                            <div className="rounded-md bg-red-50 border border-red-200 p-4 space-y-2">
                                <div className="flex items-center gap-2 text-red-700 font-semibold">
                                    <Clock className="h-4 w-4" />
                                    制限情報
                                </div>

                                {isPermanent ? (
                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">制限種別:</span>{" "}
                                        <span className="text-red-600 font-semibold">永久停止</span>
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium">制限解除日時:</span>{" "}
                                            {formatDate(banInfo?.restrictedUntil ?? null)}
                                        </p>
                                        {remaining !== null && remaining > 0 && (
                                            <p className="text-sm text-gray-700">
                                                <span className="font-medium">残り日数:</span>{" "}
                                                <span className="text-red-600 font-semibold">{remaining}日</span>
                                            </p>
                                        )}
                                        {remaining === 0 && (
                                            <p className="text-sm text-green-600 font-medium">
                                                制限期間が終了しました。再度ログインしてください。
                                            </p>
                                        )}
                                    </>
                                )}

                                {banInfo?.latestBanDate && (
                                    <p className="text-sm text-gray-500">
                                        <span className="font-medium">制限開始:</span>{" "}
                                        {formatDate(banInfo.latestBanDate)}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                            制限に心当たりがない場合や、不当な制限だと感じる場合は管理者にお問い合わせください。
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
                                <LogOut className="h-4 w-4" />
                                ログアウト
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
