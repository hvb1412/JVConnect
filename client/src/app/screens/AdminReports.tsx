import { Link } from "react-router";
import { useMemo, useState } from "react";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { CheckCircle, Eye, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { hideEventContent, isEventContentHidden } from "../lib/contentModerationStore";

type ReportItem = {
  id: string;
  type: "ユーザー" | "イベント";
  reportedBy: string;
  target: string;
  targetAvatar: string | null;
  reason: string;
  description: string;
  date: string;
  status: "未処理" | "処理済み";
  result?: "承認" | "拒否";
  banDays?: number;
};

const initialReports: ReportItem[] = [
  {
    id: "RPT-001",
    type: "ユーザー",
    reportedBy: "佐藤健太",
    target: "山田太郎",
    targetAvatar: "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMGF2YXRhciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDg5MjI0NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    reason: "不適切なコンテンツ",
    description: "プロフィールに不適切な画像が含まれています。",
    date: "2026年3月30日",
    status: "未処理",
  },
  {
    id: "RPT-002",
    type: "イベント",
    reportedBy: "田中美咲",
    target: "ビジネステックカンファレンス 2026",
    targetAvatar: null,
    reason: "スパム・詐欺",
    description: "詐欺の可能性があるイベントです。参加費用が不明瞭です。",
    date: "2026年3月29日",
    status: "未処理",
  },
  {
    id: "RPT-003",
    type: "ユーザー",
    reportedBy: "鈴木恵美",
    target: "高橋太郎",
    targetAvatar: "https://images.unsplash.com/photo-1622626426572-c268eb006092?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDk1NTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    reason: "ハラスメント",
    description: "不適切なメッセージを繰り返し送信しています。",
    date: "2026年3月28日",
    status: "未処理",
  },
  {
    id: "RPT-004",
    type: "イベント",
    reportedBy: "伊藤花子",
    target: "マルチ商法セミナー",
    targetAvatar: null,
    reason: "スパム・詐欺",
    description: "マルチ商法の勧誘イベントのようです。",
    date: "2026年3月27日",
    status: "処理済み",
  },
];

export function AdminReports() {
  const [filter, setFilter] = useState("すべて");
  const [reports, setReports] = useState<ReportItem[]>(initialReports);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [banDays, setBanDays] = useState("7");

  const selected = reports.find((r) => r.id === detailId) ?? null;
  const approving = reports.find((r) => r.id === approveId) ?? null;

  const filteredReports = useMemo(() => {
    if (filter === "すべて") return reports;
    if (filter === "ユーザー" || filter === "イベント") return reports.filter((r) => r.type === filter);
    if (filter === "未対応") return reports.filter((r) => r.status === "未処理");
    if (filter === "対応済み") return reports.filter((r) => r.status !== "未処理");
    return reports;
  }, [filter, reports]);

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
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">通報・審査管理</h1>
          <p className="text-gray-600">ユーザーからの通報を確認して対応する</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>通報一覧</CardTitle>
            <CardDescription>種別・状態で絞り込み可能</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
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
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.id}</TableCell>
                    <TableCell>{report.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {report.targetAvatar && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={report.targetAvatar} />
                            <AvatarFallback>{report.target[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        <span>{report.target}</span>
                      </div>
                    </TableCell>
                    <TableCell>{report.reportedBy}</TableCell>
                    <TableCell>{report.reason}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={report.status === "未処理" ? "destructive" : "secondary"}>
                          {report.status === "未処理" ? "未対応" : "対応済み"}
                        </Badge>
                        {report.type === "イベント" && isEventContentHidden(report.target) && (
                          <Badge variant="outline">非表示</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDetailId(report.id)}>
                          <Eye className="h-4 w-4 mr-1" />
                          詳細
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          disabled={report.status !== "未処理"}
                          onClick={() => {
                            setApproveId(report.id);
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
                          disabled={report.status !== "未処理"}
                          onClick={() => {
                            setReports((prev) =>
                              prev.map((item) =>
                                item.id === report.id
                                  ? { ...item, status: "処理済み", result: "拒否" }
                                  : item,
                              ),
                            );
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          拒否
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Dialog open={!!selected} onOpenChange={() => setDetailId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>通報詳細</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-2 text-sm">
                <p>通報種別: {selected.type}</p>
                <p>{selected.type === "ユーザー" ? "通報対象ユーザー" : "イベントタイトル"}: {selected.target}</p>
                <p>通報者: {selected.reportedBy}</p>
                <p>理由: {selected.reason}</p>
                <p>詳細: {selected.description}</p>
                <p>時刻: {selected.date}</p>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => {
                if (selected) {
                  setApproveId(selected.id);
                  setBanDays("7");
                  setDetailId(null);
                }
              }}>承認</Button>
              <Button variant="outline" onClick={() => {
                if (selected) {
                  setReports((prev) =>
                    prev.map((item) =>
                      item.id === selected.id
                        ? { ...item, status: "処理済み", result: "拒否" }
                        : item,
                    ),
                  );
                  setDetailId(null);
                }
              }}>拒否</Button>
              <Button variant="ghost" onClick={() => setDetailId(null)}>閉じる</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={!!approving} onOpenChange={() => setApproveId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {approving?.type === "ユーザー" ? "ユーザー通報を承認" : "イベント通報を承認"}
              </DialogTitle>
            </DialogHeader>
            {approving && (
              <div className="space-y-3 text-sm">
                <p>対象: {approving.target}</p>
                <p>理由: {approving.reason}</p>
                {approving.type === "ユーザー" ? (
                  <div className="space-y-2">
                    <p>利用停止日数</p>
                    <Input
                      type="number"
                      min={1}
                      value={banDays}
                      onChange={(e) => setBanDays(e.target.value)}
                    />
                    <p className="text-gray-500">ユーザーには制限画面を表示します。</p>
                  </div>
                ) : (
                  <p className="text-gray-500">イベントを非表示対象として処理します。</p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                onClick={() => {
                  if (!approving) return;
                  const days = Math.max(1, Number(banDays) || 1);
                  if (approving.type === "イベント") {
                    hideEventContent(approving.target);
                  }
                  setReports((prev) =>
                    prev.map((item) =>
                      item.id === approving.id
                        ? {
                            ...item,
                            status: "処理済み",
                            result: "承認",
                            banDays: item.type === "ユーザー" ? days : undefined,
                          }
                        : item,
                    ),
                  );
                  setApproveId(null);
                }}
              >
                承認して処理
              </Button>
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
