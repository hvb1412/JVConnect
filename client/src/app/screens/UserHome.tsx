import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Search, Calendar, User, MessageCircle } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { isEventContentHidden } from "../lib/contentModerationStore";

const recommendedUsers = [
  {
    id: 1,
    name: "田中美咲",
    role: "マーケティングマネージャー",
    mutualFriends: 6,
    avatar: "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3NDk0ODUxNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 2,
    name: "佐藤健太",
    role: "ソフトウェアエンジニア",
    mutualFriends: 3,
    avatar: "https://images.unsplash.com/photo-1622626426572-c268eb006092?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDk1NTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 3,
    name: "鈴木恵美",
    role: "プロダクトデザイナー",
    mutualFriends: 9,
    avatar: "https://images.unsplash.com/photo-1581065178026-390bc4e78dad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHByb2Zlc3Npb25hbCUyMHdvbWFufGVufDF8fHx8MTc3NDk4ODEyNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 4,
    name: "高橋大輔",
    role: "ビジネス開発",
    mutualFriends: 2,
    avatar: "https://images.unsplash.com/photo-1524538198441-241ff79d153b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMG1hbnxlbnwxfHx8fDE3NzQ4OTU2ODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
];

const recommendedEvents = [
  {
    id: 1,
    title: "スタートアップネットワーキング",
    date: "2026年4月15日",
    location: "東京",
    image: "https://images.unsplash.com/photo-1675716921224-e087a0cca69a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwbmV0d29ya2luZ3xlbnwxfHx8fDE3NzQ5ODgxMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 2,
    title: "ビジネステックカンファレンス",
    date: "2026年4月22日",
    location: "大阪",
    image: "https://images.unsplash.com/photo-1765438863717-49fca900f861?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25mZXJlbmNlJTIwc2VtaW5hcnxlbnwxfHx8fDE3NzQ5ODgxMjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 3,
    title: "チームワークショップ",
    date: "2026年5月5日",
    location: "京都",
    image: "https://images.unsplash.com/photo-1649252504727-45c70cffe143?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwd29ya3Nob3AlMjBtZWV0aW5nfGVufDF8fHx8MTc3NDk4ODEyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
];

const recentChats = [
  {
    id: 1,
    name: "田中美咲",
    lastMessage: "ありがとうございます！",
    time: "10分前",
    avatar: "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3NDk0ODUxNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
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
    avatar: "https://images.unsplash.com/photo-1622626426572-c268eb006092?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDk1NTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    unread: 0,
  },
];

export function UserHome() {
  const visibleRecommendedEvents = recommendedEvents.filter(
    (event) => !isEventContentHidden(event.title),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
          <div className="flex items-center gap-4">
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Banner */}
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="text-white">おかえりなさい！</CardTitle>
                <CardDescription className="text-blue-100">
                  今日も新しい出会いを見つけましょう
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Recommended Users */}
            <Card>
              <CardHeader>
                <CardTitle>おすすめのユーザー</CardTitle>
                <CardDescription>あなたにぴったりのビジネスパートナー</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {recommendedUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{user.name}</h3>
                            <p className="text-sm text-gray-600 truncate">{user.role}</p>
                            <p className="text-xs text-gray-500 mt-1">{user.mutualFriends}人の共通フレンド</p>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="mt-2"
                            >
                              <Link to={`/user/profile/${user.id}`}>
                                プロフィールを見る
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommended Events */}
            <Card>
              <CardHeader>
                <CardTitle>おすすめのイベント</CardTitle>
                <CardDescription>参加してネットワークを広げましょう</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {visibleRecommendedEvents.map((event) => (
                    <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex">
                        <div className="w-40 h-32 flex-shrink-0">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="flex-1 p-4">
                          <h3 className="font-semibold mb-2">{event.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Calendar className="h-4 w-4" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <span>📍 {event.location}</span>
                          </div>
                          <Button asChild size="sm">
                            <Link to="/user/events">詳細を見る</Link>
                          </Button>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                  {visibleRecommendedEvents.length === 0 && (
                    <p className="text-sm text-gray-600">
                      表示できるおすすめイベントは現在ありません。
                    </p>
                  )}
                </div>
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link to="/user/events">
                    イベント一覧へ
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>クイックアクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/user/search">
                    <Search className="mr-2 h-4 w-4" />
                    検索へ
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/user/friends">
                    <User className="mr-2 h-4 w-4" />
                    フレンド一覧へ
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/user/events">
                    <Calendar className="mr-2 h-4 w-4" />
                    イベント一覧へ
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/user/mypage">
                    <User className="mr-2 h-4 w-4" />
                    マイページへ
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Chats */}
            <Card>
              <CardHeader>
                <CardTitle>最近のチャット</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentChats.map((chat) => (
                  <Link
                    key={chat.id}
                    to={`/user/chat/${chat.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      {chat.avatar ? (
                        <AvatarImage src={chat.avatar} />
                      ) : (
                        <AvatarFallback>
                          {chat.isGroup ? "👥" : chat.name[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{chat.name}</p>
                        {chat.unread > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {chat.unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {chat.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400">{chat.time}</p>
                    </div>
                  </Link>
                ))}
                <Button asChild variant="ghost" className="w-full" size="sm">
                  <Link to="/user/chats" className="inline-flex w-full items-center justify-center">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    すべて表示
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
