import { Link } from "react-router";
import { useMemo, useState, useEffect } from "react";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { CheckCircle, Eye, XCircle, RefreshCw, Ban, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
    listReports,
    approveReport,
    rejectReport,
    AdminReport,
} from "../lib/adminApi";

const FILTER_OPTIONS = ["すべて", "ユーザー通報", "イベント通報", "未対応", "対応済み"] as const;

function decisionBadge(decision: string) {
    if (decision === "pending")
        return <Badge variant="destructive" className="text-xs">未対応</Badge>;
    if (decision === "approved")
        return <Badge className="text-xs bg-green-600 hover:bg-green-700">承認済み</Badge>;
    return <Badge variant="secondary" className="text-xs">却下</Badge>;
}

function isUserReport(r: AdminReport) {
    return !!r.user;
}

export function AdminReports() {
    const [filter, setFilter] = useState<typeof FILTER_OPTIONS[number]>("すべて");
    const [reports, setReports] = useState<AdminReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Detail dialog
    const [detailId, setDetailId] = useState<string | null>(null);
    const selected = reports.find((r) => r._id === detailId) ?? null;

    // Approve dialog
    const [approveId, setApproveId] = useState<string | null>(null);
    const approving = reports.find((r) => r._id === approveId) ?? null;
    const [banDays, setBanDays] = useState("7");
    const [approveReason, setApproveReason] = useState("");
    const [approveLoading, setApproveLoading] = useState(false);

    // Reject inline
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectLoading, setRejectLoading] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await listReports();
            setReports(data);
        } catch (err: any) {
            setError(err.message || "通報一覧の取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!approveId) return;
        setApproveLoading(true);
        try {
            const days = Math.max(0, Number(banDays) || 0);
            const updated = await approveReport(approveId, days, approveReason || "通報を承認しました");
            setReports((prev) => prev.map((r) => (r._id === approveId ? updated : r)));
            setApproveId(null);
            setBanDays("7");
            setApproveReason("");
        } catch (err: any) {
            setError(err.message || "承認に失敗しました");
        } finally {
            setApproveLoading(false);
        }
    };

    const handleReject = async (reportId: string) => {
        setRejectLoading(true);
        try {
            const updated = await rejectReport(reportId, rejectReason || "通報を却下しました");
            setReports((prev) => prev.map((r) => (r._id === reportId ? updated : r)));
            setRejectId(null);
            setDetailId(null);
            setRejectReason("");
        } catch (err: any) {
            setError(err.message || "却下に失敗しました");
        } finally {
            setRejectLoading(false);
        }
    };

    const filteredReports = useMemo(() => {
        switch (filter) {
            case "ユーザー通報": return reports.filter((r) => !!r.user);
            case "イベント通報": return reports.filter((r) => !!r.event);
            case "未対応": return reports.filter((r) => r.decision === "pending");
            case "対応済み": return reports.filter((r) => r.decision !== "pending");
            default: return reports;
        }
    }, [filter, reports]);

    const pendingCount = reports.filter((r) => r.decision === "pending").length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Logo />
                        <nav className="hidden md:flex items-center gap-6">
                            <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-900">ダッシュボード</Link>
                            <Link to="/admin/users" className="text-gray-600 hover:text-gray-900">ユーザー管理</Link>
                            <Link to="/admin/events" className="text-gray-600 hover:text-gray-900">イベント管理</Link>
                            <Link to="/admin/reports" className="text-blue-600 font-medium">通報管理</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <HeaderActions />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">通報・審査管理</h1>
                        <p className="text-gray-600">ユーザーからの通報を確認し対応する</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchReports} className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        更新
                    </Button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>通報一覧</CardTitle>
                                <CardDescription>種別・状態で絞り込み可能</CardDescription>
                            </div>
                            {pendingCount > 0 && (
                                <Badge variant="destructive" className="text-sm px-3 py-1">
                                    未対応 {pendingCount}件
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filter tabs */}
                        <div className="flex gap-2 mb-6 flex-wrap">
                            {FILTER_OPTIONS.map((item) => (
                                <Button
                                    key={item}
                                    variant={filter === item ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilter(item)}
                                >
                                    {item}
                                    {item === "未対応" && pendingCount > 0 && (
                                        <span className="ml-1.5 rounded-full bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center">
                                            {pendingCount}
                                        </span>
                                    )}
                                </Button>
                            ))}
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>種別</TableHead>
                                        <TableHead>通報対象</TableHead>
                                        <TableHead>通報者</TableHead>
                                        <TableHead>理由</TableHead>
                                        <TableHead>日時</TableHead>
                                        <TableHead>状態</TableHead>
                                        <TableHead>操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReports.length > 0 ? (
                                        filteredReports.map((report) => (
                                            <TableRow key={report._id}>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                        {isUserReport(report) ? "ユーザー" : "イベント"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {isUserReport(report) ? (
                                                            <>
                                                                <Avatar className="h-7 w-7">
                                                                    <AvatarImage src={report.user?.avatarURL} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {report.user?.name?.[0] || "?"}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-medium text-sm">
                                                                    {report.user?.name || "不明"}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm">{report.event?.title || "不明"}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {report.reporter?.name || "不明"}
                                                </TableCell>
                                                <TableCell className="text-sm max-w-[150px] truncate" title={report.reason}>
                                                    {report.reason}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                                                    {new Date(report.createdAt).toLocaleDateString("ja-JP")}
                                                </TableCell>
                                                <TableCell>{decisionBadge(report.decision)}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setDetailId(report._id)}
                                                        >
                                                            <Eye className="h-3.5 w-3.5 mr-1" />
                                                            詳細
                                                        </Button>
                                                        {report.decision === "pending" && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-green-700 border-green-300 hover:bg-green-50"
                                                                    onClick={() => {
                                                                        setApproveId(report._id);
                                                                        setBanDays("7");
                                                                        setApproveReason("");
                                                                    }}
                                                                >
                                                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                                                    承認
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                                    onClick={() => {
                                                                        setRejectId(report._id);
                                                                        setRejectReason("");
                                                                    }}
                                                                >
                                                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                                                    却下
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                                                {filter === "すべて" ? "通報はありません" : `「${filter}」に該当する通報はありません`}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Detail Dialog ──────────────────────────────────────────────────── */}
            <Dialog open={!!selected} onOpenChange={() => setDetailId(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>通報詳細</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">通報種別</p>
                                    <p>{isUserReport(selected) ? "ユーザー通報" : "イベント通報"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">状態</p>
                                    {decisionBadge(selected.decision)}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    {isUserReport(selected) ? "通報対象ユーザー" : "通報対象イベント"}
                                </p>
                                {isUserReport(selected) ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={selected.user?.avatarURL} />
                                            <AvatarFallback>{selected.user?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{selected.user?.name}</p>
                                            <p className="text-gray-500 text-xs">{selected.user?.email}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p>{selected.event?.title}</p>
                                )}
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">通報者</p>
                                <p>{selected.reporter?.name} <span className="text-gray-400">({selected.reporter?.email})</span></p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">通報理由</p>
                                <p>{selected.reason}</p>
                            </div>

                            {selected.detail && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">詳細</p>
                                    <p className="bg-gray-50 rounded p-2 whitespace-pre-wrap">{selected.detail}</p>
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">通報日時</p>
                                <p>{new Date(selected.createdAt).toLocaleString("ja-JP")}</p>
                            </div>

                            {selected.decision !== "pending" && (
                                <div className="rounded-md bg-gray-50 border p-3 space-y-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase">処理結果</p>
                                    <p>決定: {selected.decision === "approved" ? "承認" : "却下"}</p>
                                    {selected.decisionReason && <p>理由: {selected.decisionReason}</p>}
                                    {selected.banDays > 0 && <p>停止日数: {selected.banDays}日</p>}
                                    {selected.banDays === 0 && selected.decision === "approved" && <p>停止: 永久</p>}
                                    {selected.decisionDate && (
                                        <p>処理日時: {new Date(selected.decisionDate).toLocaleString("ja-JP")}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        {selected?.decision === "pending" && (
                            <>
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                        setApproveId(selected._id);
                                        setBanDays("7");
                                        setApproveReason("");
                                        setDetailId(null);
                                    }}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    承認
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-600"
                                    onClick={() => {
                                        setRejectId(selected._id);
                                        setRejectReason("");
                                        setDetailId(null);
                                    }}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    却下
                                </Button>
                            </>
                        )}
                        <Button variant="ghost" onClick={() => setDetailId(null)}>閉じる</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Approve Dialog ─────────────────────────────────────────────────── */}
            <Dialog open={!!approving} onOpenChange={() => setApproveId(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Ban className="h-5 w-5 text-orange-500" />
                            {approving && isUserReport(approving) ? "ユーザー通報を承認" : "イベント通報を承認"}
                        </DialogTitle>
                    </DialogHeader>
                    {approving && (
                        <div className="space-y-4 text-sm">
                            <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
                                <p className="font-medium">
                                    対象: {isUserReport(approving)
                                        ? approving.user?.name
                                        : approving.event?.title}
                                </p>
                                <p className="text-gray-600 mt-1">理由: {approving.reason}</p>
                            </div>

                            {isUserReport(approving) ? (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="banDays" className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            利用停止日数
                                        </Label>
                                        <Input
                                            id="banDays"
                                            type="number"
                                            min={0}
                                            value={banDays}
                                            onChange={(e) => setBanDays(e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500">
                                            {Number(banDays) <= 0
                                                ? "⚠️ 0 を指定すると永久停止になります"
                                                : `✓ ${banDays}日間の利用停止`}
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="approveReason">管理者メモ（任意）</Label>
                                        <Textarea
                                            id="approveReason"
                                            placeholder="処理理由や備考を入力..."
                                            value={approveReason}
                                            onChange={(e) => setApproveReason(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-600">
                                    イベントを非表示にします。この操作は取り消せません。
                                </p>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleApprove}
                            disabled={approveLoading}
                        >
                            {approveLoading ? "処理中..." : "承認して処理"}
                        </Button>
                        <Button variant="outline" onClick={() => setApproveId(null)} disabled={approveLoading}>
                            キャンセル
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Reject Dialog ──────────────────────────────────────────────────── */}
            <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            通報を却下する
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                        <p className="text-gray-600">この通報を却下し、対象ユーザー/イベントへの処罰を行いません。</p>
                        <div className="space-y-1.5">
                            <Label htmlFor="rejectReason">却下理由（任意）</Label>
                            <Textarea
                                id="rejectReason"
                                placeholder="却下の理由や備考を入力..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="destructive"
                            onClick={() => rejectId && handleReject(rejectId)}
                            disabled={rejectLoading}
                        >
                            {rejectLoading ? "処理中..." : "却下する"}
                        </Button>
                        <Button variant="outline" onClick={() => setRejectId(null)} disabled={rejectLoading}>
                            キャンセル
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
