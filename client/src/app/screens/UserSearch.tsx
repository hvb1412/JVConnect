import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Search, MapPin, Briefcase } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { searchUsers, type UiUser } from "../lib/userApi";

export function UserSearch() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [users, setUsers] = useState<UiUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [friendModalOpen, setFriendModalOpen] = useState(false);
  const [requested, setRequested] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const runSearch = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const searchResult = await searchUsers({
        keyword,
        area: location,
        occupation: industry,
      });
      setUsers(searchResult);
    } catch {
      setLoadError("ユーザー検索に失敗しました。しばらくしてから再試行してください。");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSearch();
  }, []);

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
              <Link to="/user/search" className="text-blue-600 font-medium">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">ユーザー検索・マッチング</h1>
          <p className="text-gray-600">あなたにぴったりのビジネスパートナーを見つけましょう</p>
        </div>

        {/* Search Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>検索フィルター</CardTitle>
            <CardDescription>条件を指定して検索してください</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">キーワード</Label>
                <Input
                  id="keyword"
                  placeholder="職種、スキル、名前など"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">場所</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="場所を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="東京">東京</SelectItem>
                    <SelectItem value="大阪">大阪</SelectItem>
                    <SelectItem value="京都">京都</SelectItem>
                    <SelectItem value="名古屋">名古屋</SelectItem>
                    <SelectItem value="福岡">福岡</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">業界</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="業界を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="テクノロジー">テクノロジー</SelectItem>
                    <SelectItem value="金融">金融</SelectItem>
                    <SelectItem value="ヘルスケア">ヘルスケア</SelectItem>
                    <SelectItem value="教育">教育</SelectItem>
                    <SelectItem value="製造業">製造業</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full md:w-auto" onClick={runSearch} disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? "検索中..." : "検索"}
            </Button>
          </CardContent>
        </Card>

        {/* Search Results */}
        <Card>
          <CardHeader>
            <CardTitle>検索結果</CardTitle>
            <CardDescription>{users.length}人のユーザーが見つかりました</CardDescription>
          </CardHeader>
          <CardContent>
            {loadError && <p className="text-sm text-red-600 mb-4">{loadError}</p>}
            <div className="space-y-4">
              {users.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Avatar className="h-20 w-20 flex-shrink-0">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold mb-1">{user.name}</h3>
                        <div className="flex flex-wrap gap-3 mb-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            <span>{user.role}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{user.location}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-medium">業界: </span>
                          {user.industry}
                        </p>
                        <p className="text-sm text-gray-600 mb-4">{user.intro}</p>
                        <div className="flex gap-2">
                          <Button asChild size="sm">
                            <Link to={`/user/profile/${user.id}`}>
                              プロフィールを見る
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={requested.includes(user.id)}
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setFriendModalOpen(true);
                            }}
                          >
                            {requested.includes(user.id) ? "申請済み" : "フレンド追加"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!isLoading && users.length === 0 && !loadError && (
                <p className="text-sm text-gray-600">条件に一致するユーザーが見つかりませんでした。</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={friendModalOpen} onOpenChange={setFriendModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フレンド申請を送信しますか？</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                if (selectedUserId && !requested.includes(selectedUserId)) {
                  setRequested((prev) => [...prev, selectedUserId]);
                }
                setFriendModalOpen(false);
              }}
            >
              送信
            </Button>
            <Button variant="outline" onClick={() => setFriendModalOpen(false)}>
              キャンセル
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
