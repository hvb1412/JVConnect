import { Link } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { RefreshCw, Search, Shield, ShieldOff, AlertCircle } from "lucide-react";
import { listUsers, toggleUserRestriction, AdminUser } from "../lib/adminApi";

export function AdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await listUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.message || "ユーザー一覧の取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRestriction = async (userId: string) => {
        try {
            const updatedUser = await toggleUserRestriction(userId, 7);
            setUsers(users.map((u) => (u._id === userId ? updatedUser : u)));
        } catch (err: any) {
            setError(err.message || "制限の切り替えに失敗しました");
        }
    };

    const filteredUsers = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase();
        if (!normalized) return users;
        return users.filter(
            (u) =>
                u.name.toLowerCase().includes(normalized) ||
                u.email.toLowerCase().includes(normalized)
        );
    }, [searchTerm, users]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">読み込み中...</p>
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
                            <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-900">ダッシュボード</Link>
                            <Link to="/admin/users" className="text-blue-600 font-medium">ユーザー管理</Link>
                            <Link to="/admin/events" className="text-gray-600 hover:text-gray-900">イベント管理</Link>
                            <Link to="/admin/reports" className="text-gray-600 hover:text-gray-900">通報管理</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <HeaderActions />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">ユーザー管理</h1>
                        <p className="text-gray-600">登録されているすべてのユーザーを管理します</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchUsers} className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        更新
                    </Button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>ユーザー一覧</CardTitle>
                        <CardDescription>総ユーザー数: {users.length}人</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6 relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="名前またはメールアドレスで検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ユーザー</TableHead>
                                        <TableHead>ロール</TableHead>
                                        <TableHead>登録日</TableHead>
                                        <TableHead>状態</TableHead>
                                        <TableHead>操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user._id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={user.avatarURL} />
                                                            <AvatarFallback>{user.name?.[0] || "?"}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">{user.name}</div>
                                                            <div className="text-sm text-gray-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {user.role === 'admin' ? (
                                                        <Badge variant="default" className="bg-purple-600">管理者</Badge>
                                                    ) : (
                                                        <Badge variant="outline">ユーザー</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                                                </TableCell>
                                                <TableCell>
                                                    {user.isRestricted ? (
                                                        <Badge variant="destructive">制限中</Badge>
                                                    ) : (
                                                        <Badge className="bg-green-600 hover:bg-green-700">アクティブ</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant={user.isRestricted ? "outline" : "destructive"}
                                                        onClick={() => handleToggleRestriction(user._id)}
                                                        disabled={user.role === 'admin'}
                                                    >
                                                        {user.isRestricted ? (
                                                            <>
                                                                <Shield className="h-3.5 w-3.5 mr-1" />
                                                                制限解除
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ShieldOff className="h-3.5 w-3.5 mr-1" />
                                                                制限する
                                                            </>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                                ユーザーが見つかりません
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
