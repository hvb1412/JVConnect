import { Link } from "react-router";
import { useMemo, useState } from "react";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Users, AlertTriangle, Calendar } from "lucide-react";
import { getAccounts, updateAccountLock } from "../lib/accountStore";

const recentReports = [
  {
    id: 1,
    type: "ユーザー",
    target: "山田太郎",
    reason: "不適切なコンテンツ",
    date: "2026年3月30日",
    status: "未処理",
  },
  {
    id: 2,
    type: "イベント",
    target: "ビジネスミートアップ",
    reason: "スパム",
    date: "2026年3月29日",
    status: "未処理",
  },
];

export function AdminDashboard() {
  const [users, setUsers] = useState(() => getAccounts());
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const stats = useMemo(
    () => [
      {
        title: "総ユーザー数",
        value: users.length.toString(),
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        title: "総通報数",
        value: "8",
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-100",
      },
      {
        title: "ロック中アカウント",
        value: users.filter((user) => user.isLocked).length.toString(),
        icon: Calendar,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
    ],
    [users],
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearchTerm = userSearchTerm.trim().toLowerCase();
    if (!normalizedSearchTerm) {
      return users;
    }

    return users.filter((user) => {
      const normalizedName = user.name.toLowerCase();
      const normalizedEmail = user.email.toLowerCase();
      return (
        normalizedName.includes(normalizedSearchTerm) ||
        normalizedEmail.includes(normalizedSearchTerm)
      );
    });
  }, [userSearchTerm, users]);

  const handleLockToggle = (userId: number, shouldLock: boolean) => {
    updateAccountLock(userId, shouldLock);
    setUsers(getAccounts());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/admin/dashboard" className="text-blue-600 font-medium">
                ダッシュボード
              </Link>
              <Link to="/admin/reports" className="text-gray-600 hover:text-gray-900">
                通報管理
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">管理ダッシュボード</h1>
          <p className="text-gray-600">システムの概要とアクティビティ</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>最近登録されたユーザー</CardTitle>
              <CardDescription>直近のユーザー登録</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={userSearchTerm}
                onChange={(event) => setUserSearchTerm(event.target.value)}
                placeholder="名前またはメールで検索"
                className="mb-4"
              />
              <div className="space-y-4">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.joinDate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            user.isLocked
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {user.isLocked ? "ロック中" : "アクティブ"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLockToggle(user.id, !user.isLocked)}
                        >
                          {user.isLocked ? "ロック解除" : "ロック"}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 bg-gray-50 rounded-lg">
                    一致するユーザーが見つかりません。
                  </div>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4">
                すべてのユーザーを表示
              </Button>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle>最新の通報</CardTitle>
              <CardDescription>処理が必要な通報</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                          {report.type}
                        </span>
                        <p className="font-semibold text-sm">{report.target}</p>
                      </div>
                      <p className="text-sm text-gray-600">{report.reason}</p>
                      <p className="text-xs text-gray-500">{report.date}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded whitespace-nowrap">
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
              <Button asChild className="w-full mt-4">
                <Link to="/admin/reports">通報管理へ</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
