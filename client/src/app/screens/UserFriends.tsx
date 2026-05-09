import { useState } from "react";
import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";

const initialFriends = [
  { id: 1, name: "田中美咲", online: true, avatar: "" },
  { id: 2, name: "佐藤健太", online: false, avatar: "" },
];

export function UserFriends() {
  const [friends, setFriends] = useState(initialFriends);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const pendingName =
    pendingDeleteId != null ? friends.find((f) => f.id === pendingDeleteId)?.name : null;

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

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">フレンド一覧</h1>
          <Button asChild variant="outline">
            <Link to="/user/friend-requests">リクエスト</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>フレンド</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {friends.length === 0 ? (
              <p className="text-gray-500">フレンドがいません</p>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback>{friend.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-gray-500">{friend.online ? "オンライン" : "オフライン"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link to={`/user/chat/${friend.id}`}>チャット</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/user/profile/${friend.id}`}>プロフィール</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setPendingDeleteId(friend.id);
                        setDeleteOpen(true);
                      }}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フレンドを削除しますか？</DialogTitle>
          </DialogHeader>
          {pendingName && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">{pendingName}</span> をフレンドから削除します。
            </p>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDeleteId != null) {
                  setFriends((prev) => prev.filter((f) => f.id !== pendingDeleteId));
                }
                setDeleteOpen(false);
                setPendingDeleteId(null);
              }}
            >
              削除
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setPendingDeleteId(null);
              }}
            >
              キャンセル
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
