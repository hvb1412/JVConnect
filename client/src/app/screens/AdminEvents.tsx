import { useState } from "react";
import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

type AdminEvent = {
  id: number;
  title: string;
  date: string;
  organizer: string;
  participants: number;
  status: "公開中" | "下書き";
  image: string;
  description?: string;
  location?: string;
};

const initialEvents: AdminEvent[] = [
  {
    id: 1,
    title: "スタートアップネットワーキング",
    date: "2026年4月15日",
    organizer: "JV Connect",
    participants: 45,
    status: "公開中",
    image: "https://images.unsplash.com/photo-1675716921224-e087a0cca69a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwbmV0d29ya2luZ3xlbnwxfHx8fDE3NzQ5ODgxMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "東京、渋谷",
    description: "スタートアップ向けネットワーキングイベントです。",
  },
  {
    id: 2,
    title: "ビジネステックカンファレンス 2026",
    date: "2026年4月22日",
    organizer: "テックビジネス協会",
    participants: 120,
    status: "公開中",
    image: "https://images.unsplash.com/photo-1765438863717-49fca900f861?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25mZXJlbmNlJTIwc2VtaW5hcnxlbnwxfHx8fDE3NzQ5ODgxMjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "大阪、梅田",
    description: "最新のビジネステクノロジーを学ぶカンファレンスです。",
  },
  {
    id: 3,
    title: "チームワークショップ",
    date: "2026年5月5日",
    organizer: "ビジネススキルアカデミー",
    participants: 30,
    status: "下書き",
    image: "https://images.unsplash.com/photo-1649252504727-45c70cffe143?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwd29ya3Nob3AlMjBtZWV0aW5nfGVufDF8fHx8MTc3NDk4ODEyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "京都、四条",
    description: "効果的なコラボレーションを学ぶワークショップです。",
  },
  {
    id: 4,
    title: "コミュニティミートアップ",
    date: "2026年5月12日",
    organizer: "名古屋ビジネスコミュニティ",
    participants: 60,
    status: "公開中",
    image: "https://images.unsplash.com/photo-1764712097778-78563f8911f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBtZWV0dXB8ZW58MXx8fHwxNzc0ODY1Mzc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "名古屋、栄",
    description: "地域のプロフェッショナルが集まるミートアップです。",
  },
];

export function AdminEvents() {
  const [events, setEvents] = useState<AdminEvent[]>(initialEvents);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventOrganizer, setNewEventOrganizer] = useState("JV Connect");
  const [newEventImage, setNewEventImage] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = selectedId ? events.find((e) => e.id === selectedId) ?? null : null;

  const openEdit = (id: number) => {
    setSelectedId(id);
    setEditOpen(true);
  };
  const openDelete = (id: number) => {
    setSelectedId(id);
    setDeleteOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
                ダッシュボード
              </Link>
              <Link to="/admin/reports" className="text-gray-600 hover:text-gray-900">
                通報管理
              </Link>
              <Link to="/admin/events" className="text-blue-600 font-medium">
                イベント管理
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">イベント管理</h1>
            <p className="text-gray-600">イベントの作成、編集、削除</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                作成
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新しいイベントを作成</DialogTitle>
                <DialogDescription>
                  イベントの詳細情報を入力してください
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">イベントタイトル</Label>
                  <Input
                    id="title"
                    placeholder="スタートアップネットワーキング"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">日付</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">時間</Label>
                    <Input id="time" type="time" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">場所</Label>
                  <Input
                    id="location"
                    placeholder="東京、渋谷"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizer">主催者</Label>
                  <Input
                    id="organizer"
                    placeholder="JV Connect"
                    value={newEventOrganizer}
                    onChange={(e) => setNewEventOrganizer(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">詳細</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="イベントの詳細を入力..."
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">イベント画像URL</Label>
                  <Input
                    id="image"
                    placeholder="https://..."
                    value={newEventImage}
                    onChange={(e) => setNewEventImage(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    disabled={!newEventTitle.trim() || !newEventDate.trim()}
                    onClick={() => {
                      const nextId = Math.max(0, ...events.map((e) => e.id)) + 1;
                      setEvents((prev) => [
                        {
                          id: nextId,
                          title: newEventTitle.trim(),
                          date: newEventDate.trim(),
                          organizer: newEventOrganizer.trim() || "JV Connect",
                          participants: 0,
                          status: "下書き",
                          image: newEventImage.trim() || prev[0]?.image || "",
                          description: newEventDescription.trim(),
                          location: newEventLocation.trim(),
                        },
                        ...prev,
                      ]);
                      setIsCreateDialogOpen(false);
                      setNewEventTitle("");
                      setNewEventDate("");
                      setNewEventOrganizer("JV Connect");
                      setNewEventLocation("");
                      setNewEventDescription("");
                      setNewEventImage("");
                    }}
                  >
                    作成
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                総イベント数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">24</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                公開中
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">18</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                下書き
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-600">6</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                総参加者数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">1,245</p>
            </CardContent>
          </Card>
        </div>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>イベント一覧</CardTitle>
            <CardDescription>すべてのイベントを管理</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>画像</TableHead>
                  <TableHead>タイトル</TableHead>
                  <TableHead>日付</TableHead>
                  <TableHead>主催者</TableHead>
                  <TableHead>参加者</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {event.date}
                    </TableCell>
                    <TableCell>{event.organizer}</TableCell>
                    <TableCell>{event.participants}人</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.status === "公開中" ? "default" : "secondary"
                        }
                        className={
                          event.status === "公開中" ? "bg-green-500" : ""
                        }
                      >
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(event.id)}
                          aria-label="編集"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => openDelete(event.id)}
                          aria-label="削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>イベントを編集</DialogTitle>
            <DialogDescription>タイトル、日時、場所、詳細を更新できます</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>イベントタイトル</Label>
                <Input
                  value={selected.title}
                  onChange={(e) =>
                    setEvents((prev) =>
                      prev.map((ev) => (ev.id === selected.id ? { ...ev, title: e.target.value } : ev)),
                    )
                  }
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>日付</Label>
                  <Input
                    value={selected.date}
                    onChange={(e) =>
                      setEvents((prev) =>
                        prev.map((ev) => (ev.id === selected.id ? { ...ev, date: e.target.value } : ev)),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>ステータス</Label>
                  <select
                    className="w-full border rounded-md h-10 px-3"
                    value={selected.status}
                    onChange={(e) =>
                      setEvents((prev) =>
                        prev.map((ev) =>
                          ev.id === selected.id ? { ...ev, status: e.target.value as AdminEvent["status"] } : ev,
                        ),
                      )
                    }
                  >
                    <option value="公開中">公開中</option>
                    <option value="下書き">下書き</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>場所</Label>
                <Input
                  value={selected.location ?? ""}
                  onChange={(e) =>
                    setEvents((prev) =>
                      prev.map((ev) => (ev.id === selected.id ? { ...ev, location: e.target.value } : ev)),
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>主催者</Label>
                <Input
                  value={selected.organizer}
                  onChange={(e) =>
                    setEvents((prev) =>
                      prev.map((ev) => (ev.id === selected.id ? { ...ev, organizer: e.target.value } : ev)),
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>詳細</Label>
                <Textarea
                  rows={4}
                  value={selected.description ?? ""}
                  onChange={(e) =>
                    setEvents((prev) =>
                      prev.map((ev) => (ev.id === selected.id ? { ...ev, description: e.target.value } : ev)),
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>イベント画像URL</Label>
                <Input
                  value={selected.image}
                  onChange={(e) =>
                    setEvents((prev) =>
                      prev.map((ev) => (ev.id === selected.id ? { ...ev, image: e.target.value } : ev)),
                    )
                  }
                />
              </div>
              <DialogFooter>
                <Button onClick={() => setEditOpen(false)}>保存</Button>
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  キャンセル
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>イベントを削除しますか？</DialogTitle>
            <DialogDescription>この操作は取り消せません</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="text-sm text-gray-700">
              対象: <span className="font-medium">{selected.title}</span>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedId) {
                  setEvents((prev) => prev.filter((ev) => ev.id !== selectedId));
                }
                setDeleteOpen(false);
                setSelectedId(null);
              }}
            >
              削除
            </Button>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              キャンセル
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
