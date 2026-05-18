import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Menu, Download } from "lucide-react";

const paymentHistory = [
  {
    id: "PAY-001",
    date: "2026年3月1日",
    plan: "スタンダードプラン",
    amount: "¥2,980",
    status: "完了",
    method: "クレジットカード (****1234)",
  },
  {
    id: "PAY-002",
    date: "2026年2月1日",
    plan: "スタンダードプラン",
    amount: "¥2,980",
    status: "完了",
    method: "クレジットカード (****1234)",
  },
  {
    id: "PAY-003",
    date: "2026年1月1日",
    plan: "スタンダードプラン",
    amount: "¥2,980",
    status: "完了",
    method: "クレジットカード (****1234)",
  },
  {
    id: "PAY-004",
    date: "2025年12月1日",
    plan: "無料プラン",
    amount: "¥0",
    status: "完了",
    method: "-",
  },
];

export function UserPaymentHistory() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/user/home" className="text-gray-600 hover:text-gray-900">
                ホーム
              </Link>
              <Link to="/user/search" className="text-gray-600 hover:text-gray-900">
                検索
              </Link>
              <Link to="/user/events" className="text-gray-600 hover:text-gray-900">
                イベント
              </Link>
              <Link to="/user/mypage" className="text-gray-600 hover:text-gray-900">
                マイページ
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <HeaderActions />
            <Button size="icon" variant="ghost">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">支払い履歴</h1>
          <p className="text-gray-600">過去の支払いを確認する</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                今月の支払い
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">¥2,980</p>
              <p className="text-sm text-gray-600 mt-1">次回: 2026年4月1日</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                年間合計
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">¥8,940</p>
              <p className="text-sm text-gray-600 mt-1">2026年</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                現在のプラン
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">スタンダード</p>
              <p className="text-sm text-gray-600 mt-1">¥2,980/月</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment History Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>支払い履歴</CardTitle>
                <CardDescription>過去の取引の詳細</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                PDFダウンロード
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>取引ID</TableHead>
                  <TableHead>日付</TableHead>
                  <TableHead>プラン</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>支払い方法</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>{payment.plan}</TableCell>
                    <TableCell className="font-semibold">{payment.amount}</TableCell>
                    <TableCell>
                      <Badge
                        variant={payment.status === "完了" ? "default" : "secondary"}
                        className="bg-green-500"
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {payment.method}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-8">
          <Button asChild variant="outline">
            <Link to="/user/mypage">マイページに戻る</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/user/subscription">プラン変更</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
