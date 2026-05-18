import { useState } from "react";
import { Link, useParams } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { ArrowLeft, Send, UserX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";

const messages = [
  {
    id: 1,
    sender: "other",
    text: "こんにちは！プロフィールを拝見しました。",
    time: "10:30",
  },
  {
    id: 2,
    sender: "me",
    text: "ありがとうございます。よろしくお願いします。",
    time: "10:32",
  },
  {
    id: 3,
    sender: "other",
    text: "来月のイベントに参加される予定はありますか？",
    time: "10:35",
  },
  {
    id: 4,
    sender: "me",
    text: "はい、参加を検討しています。一緒に行きましょうか？",
    time: "10:37",
  },
  {
    id: 5,
    sender: "other",
    text: "いいですね！それでは当日お会いしましょう。",
    time: "10:40",
  },
];

export function UserChat() {
  const { id } = useParams();
  const [message, setMessage] = useState("");
  const isFriend = id === "1" || id === "2";

  const chatUser = {
    id: id,
    name: "田中美咲",
    role: "マーケティングマネージャー",
    avatar: "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3NDk0ODUxNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    online: true,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 py-8">
        <Button asChild variant="ghost" className="mb-6 self-start">
          <Link to="/user/home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>

        <Card className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="border-b border-gray-200 p-4 flex items-center gap-3 bg-white rounded-t-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={chatUser.avatar} />
              <AvatarFallback>{chatUser.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold">{chatUser.name}</h2>
                {!isFriend ? (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-200">
                    未フレンド
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-green-50 text-green-800 border-green-200">
                    フレンド
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                {chatUser.online && (
                  <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                )}
                {chatUser.online ? "オンライン" : "オフライン"}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to={`/user/profile/${chatUser.id}`}>
                プロフィールを見る
              </Link>
            </Button>
          </div>

          {!isFriend && (
            <div className="px-4 pb-2">
              <Alert className="border-amber-200 bg-amber-50 text-amber-950 [&>svg]:text-amber-700">
                <UserX className="h-4 w-4" />
                <AlertTitle>フレンドではないユーザーです</AlertTitle>
                <AlertDescription className="text-amber-900/90">
                  このユーザーとはまだフレンド関係ではありません。メッセージの送受信はできません。プロフィールからフレンド申請を送信してください。
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Messages Area */}
          <CardContent className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-[240px]">
            {isFriend ? (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-2 max-w-[70%] ${msg.sender === "me" ? "flex-row-reverse" : ""}`}>
                      {msg.sender === "other" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={chatUser.avatar} />
                          <AvatarFallback>{chatUser.name[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            msg.sender === "me"
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                        </div>
                        <p
                          className={`text-xs text-gray-500 mt-1 ${
                            msg.sender === "me" ? "text-right" : "text-left"
                          }`}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-sm text-gray-500 px-4">
                <p className="font-medium text-gray-700 mb-1">メッセージはありません</p>
                <p>フレンドになると、ここで会話が表示されます。</p>
              </div>
            )}
          </CardContent>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <Input
                placeholder="メッセージを入力..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    setMessage("");
                  }
                }}
                className="flex-1"
                disabled={!isFriend}
              />
              <Button size="icon" className="flex-shrink-0" disabled={!isFriend || !message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!isFriend && (
              <p className="text-sm text-amber-800 mt-2">
                未フレンドのため送信できません。プロフィールからフレンド申請を行ってください。
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
