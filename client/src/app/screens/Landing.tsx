import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { UserCircle, Users, Shield } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Logo />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            JV Connect
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            ビジネスパートナーとつながり、成長しましょう
          </p>
          <p className="text-lg text-gray-500">
            デモアプリケーション - 以下から役割を選択してください
          </p>
        </div>

        {/* App Selection Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Guest App Card */}
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-blue-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-fit">
                <UserCircle className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">ゲストアプリ</CardTitle>
              <CardDescription>
                登録とログイン機能
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 space-y-2 mb-4">
                <p>✓ ログイン画面</p>
                <p>✓ 新規登録画面</p>
                <p>✓ 認証フロー</p>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link to="/guest/login">ゲストアプリを開く</Link>
              </Button>
            </CardContent>
          </Card>

          {/* User App Card */}
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-purple-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-purple-100 rounded-full w-fit">
                <Users className="h-12 w-12 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">ユーザーアプリ</CardTitle>
              <CardDescription>
                メイン機能とダッシュボード
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 space-y-2 mb-4">
                <p>✓ ホーム画面</p>
                <p>✓ ユーザー検索</p>
                <p>✓ チャット機能</p>
                <p>✓ イベント管理</p>
                <p>✓ プロフィール設定</p>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link to="/user/home">ユーザーアプリを開く</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Admin App Card */}
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-green-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-fit">
                <Shield className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl">管理者アプリ</CardTitle>
              <CardDescription>
                管理とモデレーション
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 space-y-2 mb-4">
                <p>✓ 管理ダッシュボード</p>
                <p>✓ 通報審査</p>
                <p>✓ イベント管理</p>
                <p>✓ ユーザー管理</p>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link to="/admin/dashboard">管理者アプリを開く</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="max-w-3xl mx-auto mt-16">
          <CardHeader>
            <CardTitle>デモについて</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-600">
            <p>
              このデモは3つの独立したアプリケーションフローを示しています。
              各アプリは異なるユーザー役割に対応しています。
            </p>
            <div className="grid md:grid-cols-3 gap-4 pt-4">
              <div>
                <h3 className="font-semibold mb-2">ゲストアプリ</h3>
                <p className="text-sm">未登録ユーザー向けの認証インターフェース</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">ユーザーアプリ</h3>
                <p className="text-sm">登録済みユーザー向けのメイン機能</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">管理者アプリ</h3>
                <p className="text-sm">プラットフォーム管理者向けの管理機能</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
