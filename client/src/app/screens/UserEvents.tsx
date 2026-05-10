import { useState } from "react";
import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar, MapPin, Users, CheckCircle2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { isEventContentHidden } from "../lib/contentModerationStore";

const events = [
  {
    id: 1,
    title: "スタートアップネットワーキング",
    date: "2026年4月15日",
    time: "18:00 - 21:00",
    location: "東京、渋谷",
    participants: 45,
    image: "https://images.unsplash.com/photo-1675716921224-e087a0cca69a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwbmV0d29ya2luZ3xlbnwxfHx8fDE3NzQ5ODgxMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "スタートアップの創業者、投資家、エンジニアが集まるネットワーキングイベントです。新しいビジネスチャンスを見つけましょう。",
    organizer: "JV Connect",
    category: "ネットワーキング",
  },
  {
    id: 2,
    title: "ビジネステックカンファレンス 2026",
    date: "2026年4月22日",
    time: "09:00 - 18:00",
    location: "大阪、梅田",
    participants: 120,
    image: "https://images.unsplash.com/photo-1765438863717-49fca900f861?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25mZXJlbmNlJTIwc2VtaW5hcnxlbnwxfHx8fDE3NzQ5ODgxMjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "最新のビジネステクノロジーとイノベーションについて学ぶカンファレンスです。業界のリーダーによる講演とワークショップを提供します。",
    organizer: "テックビジネス協会",
    category: "カンファレンス",
  },
  {
    id: 3,
    title: "チームワークショップ：効果的なコラボレーション",
    date: "2026年5月5日",
    time: "14:00 - 17:00",
    location: "京都、四条",
    participants: 30,
    image: "https://images.unsplash.com/photo-1649252504727-45c70cffe143?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwd29ya3Nob3AlMjBtZWV0aW5nfGVufDF8fHx8MTc3NDk4ODEyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "チームワークとコラボレーションスキルを向上させるための実践的なワークショップです。",
    organizer: "ビジネススキルアカデミー",
    category: "ワークショップ",
  },
  {
    id: 4,
    title: "コミュニティミートアップ",
    date: "2026年5月12日",
    time: "19:00 - 22:00",
    location: "名古屋、栄",
    participants: 60,
    image: "https://images.unsplash.com/photo-1764712097778-78563f8911f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBtZWV0dXB8ZW58MXx8fHwxNzc0ODY1Mzc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "地域のプロフェッショナルが集まるカジュアルなミートアップです。新しい友人やビジネスパートナーを見つけましょう。",
    organizer: "名古屋ビジネスコミュニティ",
    category: "ミートアップ",
  },
];

export function UserEvents() {
  const visibleEvents = events.filter((event) => !isEventContentHidden(event.title));
  const [selectedEvent, setSelectedEvent] = useState(visibleEvents[0] ?? null);
  const joinedEventIds = [1, 3];
  const isJoined = selectedEvent ? joinedEventIds.includes(selectedEvent.id) : false;

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
              <Link to="/user/friends" className="text-gray-600 hover:text-gray-900">
                フレンド
              </Link>
              <Link to="/user/events" className="text-blue-600 font-medium">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">イベント</h1>
          <p className="text-gray-600">参加してネットワークを広げましょう</p>
        </div>

        <Tabs defaultValue="all" className="mb-8">
          <TabsList>
            <TabsTrigger value="all">すべて</TabsTrigger>
            <TabsTrigger value="upcoming">今後のイベント</TabsTrigger>
            <TabsTrigger value="past">過去のイベント</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {visibleEvents.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-gray-600">
                  表示可能なイベントはありません。運営審査中の可能性があります。
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
              {/* Event List */}
              <div className="space-y-4">
                {visibleEvents.map((event) => (
                  <Card
                    key={event.id}
                    className={`cursor-pointer transition-all ${
                      selectedEvent?.id === event.id
                        ? "ring-2 ring-blue-500 shadow-md"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex">
                      <div className="w-32 h-32 flex-shrink-0">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover rounded-l-lg"
                        />
                      </div>
                      <CardContent className="flex-1 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="secondary">{event.category}</Badge>
                          {joinedEventIds.includes(event.id) && (
                            <Badge className="bg-green-600 hover:bg-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              参加済み
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold mb-2">{event.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Calendar className="h-4 w-4" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Event Details */}
              <div className="lg:sticky lg:top-24 h-fit">
                <Card>
                  <div className="w-full h-64">
                    <img
                      src={selectedEvent?.image}
                      alt={selectedEvent?.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{selectedEvent?.category}</Badge>
                        {isJoined && (
                          <Badge className="bg-green-600 hover:bg-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            参加済み
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{selectedEvent?.participants}人参加</span>
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{selectedEvent?.title}</CardTitle>
                    <CardDescription className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4" />
                        <span>{selectedEvent?.date} {selectedEvent?.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedEvent?.location}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">詳細</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedEvent?.description}
                      </p>
                    </div>
                    <div className="mb-6">
                      <h3 className="font-semibold mb-1">主催者</h3>
                      <p className="text-gray-700">{selectedEvent?.organizer}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link to={`/user/events/${selectedEvent?.id}`}>詳細を見る</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/user/events/joined">参加イベント</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            <p className="text-gray-600">今後のイベントが表示されます</p>
          </TabsContent>

          <TabsContent value="past">
            <p className="text-gray-600">過去のイベントが表示されます</p>
          </TabsContent>
        </Tabs>

        <Button asChild variant="outline" className="mt-6">
          <Link to="/user/home">ホームに戻る</Link>
        </Button>
      </div>
    </div>
  );
}
