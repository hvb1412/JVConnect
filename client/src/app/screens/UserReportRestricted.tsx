import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AlertTriangle } from "lucide-react";

export function UserReportRestricted() {
  const bannedDays = 7;
  const banReason = "不適切な内容の投稿および繰り返しの迷惑行為";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <LanguageToggle />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              アカウント制限中
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              通報の審査結果により、あなたのアカウントは現在利用制限中です。
            </p>
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <p className="font-medium">制限日数: {bannedDays}日</p>
              <p className="font-medium mt-2">制限理由: {banReason}</p>
              <p className="text-sm text-gray-600 mt-1">期間中はチャット・イベント参加などの機能を利用できません。</p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/guest/login">ログイン画面へ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
