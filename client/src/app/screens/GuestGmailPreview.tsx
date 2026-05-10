import { Link, useLocation } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Mail, Clock3 } from "lucide-react";

export function GuestGmailPreview() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const email = params.get("email") ?? "your.email@example.com";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <LanguageToggle />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">受信トレイ（デモ）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-blue-50 p-3">
              <p className="font-medium text-sm">JV Connect サポート</p>
              <p className="text-sm">認証コードのご案内</p>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                たった今
              </div>
            </div>
            <p className="text-xs text-gray-500">
              宛先: {email}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              認証コードのご案内
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>{email} 様</p>
            <p>
              JV Connectをご利用いただきありがとうございます。パスワード再設定のリクエストを受け付けました。
            </p>
            <p>
              以下の認証コードをコード入力画面に入力してください。このコードは10分間有効です。
            </p>
            <div className="rounded-md bg-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">認証コード</p>
              <p className="text-2xl font-bold tracking-[0.25em]">583 291</p>
            </div>
            <p>
              このメールに心当たりがない場合は、メールを破棄してください。
            </p>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
