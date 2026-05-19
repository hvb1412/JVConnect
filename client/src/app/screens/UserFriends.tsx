import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { getFriendList, deleteFriend, getIncomingRequests, FriendshipData } from "../lib/userApi";

export function UserFriends() {
  const [friends, setFriends] = useState<FriendshipData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  useEffect(() => {
    loadFriends();
    loadRequestCount();
  }, []);

  const loadRequestCount = async () => {
    try {
      const requests = await getIncomingRequests();
      setPendingRequestCount(requests.length);
    } catch {
      // Silently fail
    }
  };

  const loadFriends = async () => {
    try {
        setIsLoading(true);
        const data = await getFriendList();
        setFriends(data);
    } catch (error) {
        console.error("Failed to load friends", error);
    } finally {
        setIsLoading(false);
    }
  };

  const pendingName =
    pendingDeleteId != null ? friends.find((f) => f.friend.id === pendingDeleteId)?.friend.name : null;

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
          <HeaderActions />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">フレンド一覧</h1>
          <Button asChild variant="outline" className="relative">
            <Link to="/user/friend-requests">
              リクエスト
              {pendingRequestCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold w-5 h-5">
                  {pendingRequestCount}
                </span>
              )}
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>フレンド</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-gray-500">読み込み中...</p>
            ) : friends.length === 0 ? (
              <p className="text-gray-500">フレンドがいません</p>
            ) : (
              friends.map((item) => (
                <div key={item.friendshipId} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={item.friend.avatar} />
                      <AvatarFallback>{item.friend.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{item.friend.name}</p>
                      <p className="text-sm text-gray-500">オフライン</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link to={`/user/chat/${item.friend.id}`}>チャット</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/user/profile/${item.friend.id}`}>プロフィール</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setPendingDeleteId(item.friend.id);
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
              onClick={async () => {
                if (pendingDeleteId != null) {
                  try {
                    await deleteFriend(pendingDeleteId);
                    setFriends((prev) => prev.filter((f) => f.friend.id !== pendingDeleteId));
                  } catch (error) {
                    console.error("Failed to delete friend", error);
                  }
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
