import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";

const requests = [
  { id: 11, name: "鈴木恵美" },
  { id: 12, name: "高橋大輔" },
];

export function UserFriendRequests() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/user/home">ホーム</Link>
              <Link to="/user/search">検索</Link>
              <Link to="/user/friends" className="text-blue-600 font-medium">フレンド</Link>
              <Link to="/user/events">イベント</Link>
              <Link to="/user/mypage">マイページ</Link>
            </nav>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>フレンドリクエスト</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{request.name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{request.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm">承認</Button>
                  <Button size="sm" variant="outline">拒否</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
