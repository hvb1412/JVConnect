import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const joinedEvents = [
  { id: 1, title: "スタートアップネットワーキング", date: "2026年4月15日", location: "東京" },
  { id: 2, title: "ビジネステックカンファレンス", date: "2026年4月22日", location: "大阪" },
];

export function UserJoinedEvents() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/user/home">ホーム</Link>
              <Link to="/user/search">検索</Link>
              <Link to="/user/friends">フレンド</Link>
              <Link to="/user/events" className="text-blue-600 font-medium">イベント</Link>
              <Link to="/user/mypage">マイページ</Link>
            </nav>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>自分の参加イベント</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {joinedEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-gray-500">{event.date} ・ {event.location}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/user/events/${event.id}`}>詳細を見る</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
