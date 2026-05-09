import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";

const allChats = [
  {
    id: 1,
    name: "田中美咲",
    lastMessage: "ありがとうございます！",
    time: "10分前",
    avatar:
      "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3NDk0ODUxNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    unread: 2,
  },
  {
    id: 2,
    name: "開発者グループ",
    lastMessage: "明日のミーティングは...",
    time: "1時間前",
    avatar: null,
    isGroup: true,
    unread: 0,
  },
  {
    id: 3,
    name: "佐藤健太",
    lastMessage: "了解しました",
    time: "3時間前",
    avatar:
      "https://images.unsplash.com/photo-1622626426572-c268eb006092?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDk1NTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    unread: 0,
  },
  {
    id: 4,
    name: "鈴木恵美",
    lastMessage: "イベントの件、後で連絡します",
    time: "昨日",
    avatar:
      "https://images.unsplash.com/photo-1581065178026-390bc4e78dad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHByb2Zlc3Npb25hbCUyMHdvbWFufGVufDF8fHx8MTc3NDk4ODEyNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    unread: 1,
  },
  {
    id: 5,
    name: "高橋大輔",
    lastMessage: "お疲れ様です",
    time: "2日前",
    avatar:
      "https://images.unsplash.com/photo-1524538198441-241ff79d153b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMG1hbnxlbnwxfHx8fDE3NzQ4OTU2ODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    unread: 0,
  },
];

export function UserChatsList() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/user/home" className="text-blue-600 font-medium">
                ホーム
              </Link>
              <Link to="/user/search" className="text-gray-600 hover:text-gray-900">
                検索
              </Link>
              <Link to="/user/friends" className="text-gray-600 hover:text-gray-900">
                フレンド
              </Link>
              <Link to="/user/events" className="text-gray-600 hover:text-gray-900">
                イベント
              </Link>
              <Link to="/user/mypage" className="text-gray-600 hover:text-gray-900">
                マイページ
              </Link>
            </nav>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/user/home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              チャット一覧
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {allChats.map((chat) => (
              <Link
                key={chat.id}
                to={`/user/chat/${chat.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
              >
                <Avatar className="h-12 w-12">
                  {chat.avatar ? (
                    <AvatarImage src={chat.avatar} />
                  ) : (
                    <AvatarFallback>{chat.isGroup ? "👥" : chat.name[0]}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{chat.name}</p>
                    {chat.unread > 0 && (
                      <Badge variant="destructive" className="shrink-0">
                        {chat.unread}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">{chat.lastMessage}</p>
                  <p className="text-xs text-gray-400">{chat.time}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
