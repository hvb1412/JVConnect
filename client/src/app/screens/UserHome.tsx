import { Link } from "react-router";
import { useEffect, useState } from "react";
import { getSuggestedUsers, UiUser } from "../lib/userApi";
import { getSuggestedEvents, UiEvent } from "../lib/eventApi";
import { getConversations, UiConversation } from "../lib/conversationApi";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Search, Calendar, User, MessageCircle } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { isEventContentHidden } from "../lib/contentModerationStore";

export function UserHome() {
  const [recommendedUsers, setRecommendedUsers] = useState<UiUser[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<UiEvent[]>([]);
  const [recentChats, setRecentChats] = useState<UiConversation[]>([]);

  useEffect(() => {
    getSuggestedUsers().then(setRecommendedUsers);
    getSuggestedEvents().then(setRecommendedEvents);
    getConversations().then((data) => setRecentChats(data.slice(0, 3)));
  }, []);

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
            <HeaderActions />
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
                            <p className="text-xs text-gray-500 mt-1">{user.location}</p>
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
                            <Link to={`/user/events/${event.id}`}>詳細を見る</Link>
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
                {recentChats.length === 0 ? (
                  <p className="text-sm text-gray-600 py-2">
                    最近のチャットはありません。
                  </p>
                ) : (
                  recentChats.map((chat) => (
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
                            {chat.name[0]}
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
                  ))
                )}
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
