import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
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
import {
  listAdminEvents,
  createAdminEvent,
  updateAdminEvent,
  deleteAdminEvent,
  AdminEvent,
} from "../lib/adminApi";

export function AdminEvents() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("");
  const [newEventEndTime, setNewEventEndTime] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventImage, setNewEventImage] = useState("");
  const [newEventStatus, setNewEventStatus] = useState<"active" | "draft">("draft");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<AdminEvent>>({});

  const selected = selectedId ? events.find((e) => e._id === selectedId) : null;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await listAdminEvents();
      setEvents(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load events");
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate.trim() || !newEventLocation.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const newEvent = await createAdminEvent({
        title: newEventTitle.trim(),
        eventDate: new Date(newEventDate).toISOString(),
        startTime: newEventStartTime,
        endTime: newEventEndTime,
        location: newEventLocation.trim(),
        detail: newEventDescription.trim(),
        imageURL: newEventImage.trim(),
        status: newEventStatus,
      });

      setEvents([newEvent, ...events]);
      setIsCreateDialogOpen(false);
      setNewEventTitle("");
      setNewEventDate("");
      setNewEventStartTime("");
      setNewEventEndTime("");
      setNewEventDescription("");
      setNewEventLocation("");
      setNewEventImage("");
      setNewEventStatus("draft");
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to create event");
      console.error("Error creating event:", err);
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedId || !selected) return;

    try {
      const updated = await updateAdminEvent(selectedId, {
        ...editFormData,
        eventDate: editFormData.eventDate
          ? typeof editFormData.eventDate === "string"
            ? editFormData.eventDate
            : new Date(editFormData.eventDate).toISOString()
          : selected.eventDate,
      });

      setEvents(events.map((e) => (e._id === selectedId ? updated : e)));
      setEditOpen(false);
      setSelectedId(null);
      setEditFormData({});
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to update event");
      console.error("Error updating event:", err);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedId) return;

    try {
      await deleteAdminEvent(selectedId);
      setEvents(events.filter((e) => e._id !== selectedId));
      setDeleteOpen(false);
      setSelectedId(null);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to delete event");
      console.error("Error deleting event:", err);
    }
  };

  const openEdit = (id: string) => {
    const event = events.find((e) => e._id === id);
    if (event) {
      setSelectedId(id);
      setEditFormData({ ...event });
      setEditOpen(true);
    }
  };

  const openDelete = (id: string) => {
    setSelectedId(id);
    setDeleteOpen(true);
  };

  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === "active").length;
  const draftEvents = events.filter((e) => e.status === "draft").length;
  const totalParticipants = events.reduce((sum, e) => sum + (e.participants?.length || 0), 0);

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
            <HeaderActions />
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
                <DialogDescription>イベントの詳細情報を入力してください</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">イベントタイトル*</Label>
                  <Input
                    id="title"
                    placeholder="スタートアップネットワーキング"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">日付*</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">ステータス</Label>
                    <select
                      className="w-full border rounded-md h-10 px-3"
                      value={newEventStatus}
                      onChange={(e) => setNewEventStatus(e.target.value as "active" | "draft")}
                    >
                      <option value="draft">下書き</option>
                      <option value="active">公開中</option>
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">開始時間</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newEventStartTime}
                      onChange={(e) => setNewEventStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">終了時間</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newEventEndTime}
                      onChange={(e) => setNewEventEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">場所*</Label>
                  <Input
                    id="location"
                    placeholder="東京、渋谷"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
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
                    disabled={!newEventTitle.trim() || !newEventDate.trim() || !newEventLocation.trim()}
                    onClick={handleCreateEvent}
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

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">総イベント数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalEvents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">公開中</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{activeEvents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">下書き</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-600">{draftEvents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">総参加者数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalParticipants}</p>
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
                  <TableRow key={event._id}>
                    <TableCell>
                      {event.imageURL && (
                        <img
                          src={event.imageURL}
                          alt={event.title}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(event.eventDate).toLocaleDateString("ja-JP")}
                    </TableCell>
                    <TableCell>{event.organizer?.name || "Unknown"}</TableCell>
                    <TableCell>{event.participants?.length || 0}人</TableCell>
                    <TableCell>
                      <Badge
                        variant={event.status === "active" ? "default" : "secondary"}
                        className={event.status === "active" ? "bg-green-500" : ""}
                      >
                        {event.status === "active" ? "公開中" : "下書き"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(event._id)}
                          aria-label="編集"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => openDelete(event._id)}
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
            {events.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                イベントはまだ作成されていません
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
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
                  value={editFormData.title || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>日付</Label>
                  <Input
                    type="date"
                    value={
                      editFormData.eventDate
                        ? new Date(editFormData.eventDate).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => setEditFormData({ ...editFormData, eventDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ステータス</Label>
                  <select
                    className="w-full border rounded-md h-10 px-3"
                    value={editFormData.status || "active"}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  >
                    <option value="active">公開中</option>
                    <option value="draft">下書き</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>開始時間</Label>
                  <Input
                    type="time"
                    value={editFormData.startTime || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>終了時間</Label>
                  <Input
                    type="time"
                    value={editFormData.endTime || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>場所</Label>
                <Input
                  value={editFormData.location || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>詳細</Label>
                <Textarea
                  rows={4}
                  value={editFormData.detail || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, detail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>イベント画像URL</Label>
                <Input
                  value={editFormData.imageURL || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, imageURL: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleUpdateEvent}>保存</Button>
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  キャンセル
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
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
            <Button variant="destructive" onClick={handleDeleteEvent}>
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
            <HeaderActions />
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
