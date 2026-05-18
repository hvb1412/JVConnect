import { Link } from "react-router";
import { useMemo, useState, useEffect } from "react";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { CheckCircle, Eye, XCircle } from "lucide-react";
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

export function AdminReports() {
  const [filter, setFilter] = useState("すべて");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [banDays, setBanDays] = useState("7");
  const [rejectReason, setRejectReason] = useState("");

  const selected = reports.find((r) => r._id === detailId);
  const approving = reports.find((r) => r._id === approveId);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await listReports();
      setReports(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReport = async () => {
    if (!approveId || !approving) return;

    try {
      const days = Math.max(0, Number(banDays) || 0);
      const updated = await approveReport(approveId, days, "Approved by admin");
      setReports(reports.map((r) => (r._id === approveId ? updated : r)));
      setApproveId(null);
      setBanDays("7");
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to approve report");
      console.error("Error approving report:", err);
    }
  };

  const handleRejectReport = async (reportId: string) => {
    try {
      const updated = await rejectReport(reportId, rejectReason);
      setReports(reports.map((r) => (r._id === reportId ? updated : r)));
      setDetailId(null);
      setRejectReason("");
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to reject report");
      console.error("Error rejecting report:", err);
    }
  };

  const filteredReports = useMemo(() => {
    if (filter === "すべて") return reports;
    if (filter === "ユーザー" || filter === "イベント") {
      return reports.filter((r) => r.reportType === filter);
    }
    if (filter === "未対応") return reports.filter((r) => r.decision === "pending");
    if (filter === "対応済み") return reports.filter((r) => r.decision !== "pending");
    return reports;
  }, [filter, reports]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
              <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
                ダッシュボード
              </Link>
              <Link to="/admin/reports" className="text-blue-600 font-medium">
                通報管理
              </Link>
              <Link to="/admin/events" className="text-gray-600 hover:text-gray-900">
                イベント管理
              </Link>
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
          <h1 className="text-3xl font-bold mb-2">通報・審査管理</h1>
          <p className="text-gray-600">ユーザーからの通報を確認して対応する</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>通報一覧</CardTitle>
            <CardDescription>種別・状態で絞り込み可能</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 flex-wrap">
              {["すべて", "ユーザー", "イベント", "未対応", "対応済み"].map((item) => (
                <Button
                  key={item}
                  variant={filter === item ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length > 0 ? (
                    filteredReports.map((report) => (
                      <TableRow key={report._id}>
                        <TableCell className="font-medium">{report._id.slice(0, 8)}...</TableCell>
                        <TableCell>{report.reportType}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {report.reportType === "ユーザー" && report.user?.avatarURL && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={report.user.avatarURL} />
                                <AvatarFallback>{report.user.name?.[0] || "?"}</AvatarFallback>
                              </Avatar>
                            )}
                            <span>
                              {report.reportType === "ユーザー"
                                ? report.user?.name || "Unknown"
                                : report.event?.title || "Unknown"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{report.reporter?.name || "Unknown"}</TableCell>
                        <TableCell>{report.reason}</TableCell>
                        <TableCell>{new Date(report.createdAt).toLocaleDateString("ja-JP")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant={report.decision === "pending" ? "destructive" : "secondary"}
                            >
                              {report.decision === "pending"
                                ? "未対応"
                                : report.decision === "approved"
                                  ? "承認"
                                  : "却下"}
                            </Badge>
                            {report.reportType === "イベント" && report.event?.status === "inactive" && (
                              <Badge variant="outline">非表示</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDetailId(report._id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              詳細
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              disabled={report.decision !== "pending"}
                              onClick={() => {
                                setApproveId(report._id);
                                setBanDays("7");
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              承認
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              disabled={report.decision !== "pending"}
                              onClick={() => {
                                handleRejectReport(report._id);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              拒否
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        通報はありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selected} onOpenChange={() => setDetailId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>通報詳細</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-600">通報種別</p>
                  <p>{selected.reportType}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">
                    {selected.reportType === "ユーザー" ? "通報対象ユーザー" : "イベント"}
                  </p>
                  <p>
                    {selected.reportType === "ユーザー"
                      ? selected.user?.name || "Unknown"
                      : selected.event?.title || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">通報者</p>
                  <p>{selected.reporter?.name || "Unknown"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">理由</p>
                  <p>{selected.reason}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">詳細</p>
                  <p>{selected.detail || "No additional details"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600">時刻</p>
                  <p>{new Date(selected.createdAt).toLocaleString("ja-JP")}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                onClick={() => {
                  if (selected) {
                    setApproveId(selected._id);
                    setBanDays("7");
                    setDetailId(null);
                  }
                }}
                disabled={selected?.decision !== "pending"}
              >
                承認
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (selected) {
                    handleRejectReport(selected._id);
                  }
                }}
                disabled={selected?.decision !== "pending"}
              >
                拒否
              </Button>
              <Button variant="ghost" onClick={() => setDetailId(null)}>
                閉じる
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={!!approving} onOpenChange={() => setApproveId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {approving?.reportType === "ユーザー" ? "ユーザー通報を承認" : "イベント通報を承認"}
              </DialogTitle>
            </DialogHeader>
            {approving && (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">対象</p>
                  <p>
                    {approving.reportType === "ユーザー"
                      ? approving.user?.name || "Unknown"
                      : approving.event?.title || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">理由</p>
                  <p>{approving.reason}</p>
                </div>
                {approving.reportType === "ユーザー" ? (
                  <div className="space-y-2">
                    <Label htmlFor="banDays">利用停止日数</Label>
                    <Input
                      id="banDays"
                      type="number"
                      min={0}
                      value={banDays}
                      onChange={(e) => setBanDays(e.target.value)}
                    />
                    <p className="text-gray-500 text-xs">0を指定すると永久停止になります</p>
                  </div>
                ) : (
                  <p className="text-gray-500">イベントを非表示対象として処理します。</p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleApproveReport}>承認して処理</Button>
              <Button variant="outline" onClick={() => setApproveId(null)}>
                キャンセル
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
