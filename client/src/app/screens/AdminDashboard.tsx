import { Link } from "react-router";
import { useMemo, useState, useEffect } from "react";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Users, AlertTriangle, Calendar } from "lucide-react";
import { listUsers, toggleUserRestriction, listReports, AdminUser, AdminReport } from "../lib/adminApi";

export function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersData, reportsData] = await Promise.all([
          listUsers(),
          listReports(),
        ]);
        setUsers(usersData);
        setReports(reportsData);
        setError("");
      } catch (err: any) {
        setError(err.message || "Failed to load data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        value: reports.length.toString(),
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-100",
      },
      {
        title: "制限中アカウント",
        value: users.filter((user) => user.isRestricted).length.toString(),
        icon: Calendar,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
    ],
    [users, reports],
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearchTerm = userSearchTerm.trim().toLowerCase();
    if (!normalizedSearchTerm) {
      return users.slice(0, 5);
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

  const recentReports = useMemo(() => {
    return reports.filter(r => r.decision === 'pending').slice(0, 5);
  }, [reports]);

  const handleLockToggle = async (userId: string) => {
    try {
      const updatedUser = await toggleUserRestriction(userId, 7);
      setUsers(users.map(u => u._id === userId ? updatedUser : u));
    } catch (err: any) {
      console.error("Error toggling restriction:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
              <Link to="/admin/events" className="text-gray-600 hover:text-gray-900">
                イベント管理
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

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

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
                      key={user._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            user.isRestricted
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {user.isRestricted ? "制限中" : "アクティブ"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLockToggle(user._id)}
                        >
                          {user.isRestricted ? "解除" : "制限"}
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
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/admin/users">すべてのユーザーを表示</Link>
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
                {recentReports.length > 0 ? (
                  recentReports.map((report) => (
                    <div
                      key={report._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                            {report.reportType}
                          </span>
                          <p className="font-semibold text-sm">
                            {report.user?.name || report.event?.title || "Unknown"}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">{report.reason}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded whitespace-nowrap">
                        {report.decision === 'pending' ? '未対応' : report.decision === 'approved' ? '承認' : '却下'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 bg-gray-50 rounded-lg">
                    未処理の通報はありません。
                  </div>
                )}
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
