import { useState, useEffect, useRef } from "react";
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
import { Plus, Edit, Trash2, Calendar, Upload, Users, Check, X, Clock, Eye } from "lucide-react";
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
  listEventParticipations,
  listPendingParticipations,
  approveParticipation,
  rejectParticipation,
  AdminParticipation,
} from "../lib/adminApi";
import { useTranslation } from "../lib/i18n";
import { uploadImageByUrl } from "../lib/uploadApi";

export function AdminEvents() {
  const { t } = useTranslation();
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<AdminEvent>>({});

  const [viewOpen, setViewOpen] = useState(false);
  const [pendingEventIds, setPendingEventIds] = useState<Set<string>>(new Set());

  const selected = selectedId ? events.find((e) => e._id === selectedId) : null;

  // ── Participation management state ────────────────────────────────────────
  const [participationDialogOpen, setParticipationDialogOpen] = useState(false);
  const [participationEventId, setParticipationEventId] = useState<string | null>(null);
  const [participationEventTitle, setParticipationEventTitle] = useState("");
  const [participations, setParticipations] = useState<AdminParticipation[]>([]);
  const [participationsLoading, setParticipationsLoading] = useState(false);
  const [participationActionLoading, setParticipationActionLoading] = useState<string | null>(null);

  const openParticipationDialog = async (eventId: string, eventTitle: string) => {
    setParticipationEventId(eventId);
    setParticipationEventTitle(eventTitle);
    setParticipationDialogOpen(true);
    setParticipationsLoading(true);
    try {
      const data = await listEventParticipations(eventId);
      setParticipations(data);
    } catch (err) {
      console.error("Failed to load participations", err);
    } finally {
      setParticipationsLoading(false);
    }
  };

  const handleApproveParticipation = async (userId: string) => {
    if (!participationEventId) return;
    setParticipationActionLoading(userId);
    try {
      const result = await approveParticipation(participationEventId, userId);
      setParticipations((prev) =>
        prev.map((p) => (p.user._id === userId ? result.participation : p))
      );
    } catch (err: any) {
      alert(err?.message || "Failed to approve");
    } finally {
      setParticipationActionLoading(null);
    }
  };

  const handleRejectParticipation = async (userId: string) => {
    if (!participationEventId) return;
    setParticipationActionLoading(userId);
    try {
      const result = await rejectParticipation(participationEventId, userId);
      setParticipations((prev) =>
        prev.map((p) => (p.user._id === userId ? result : p))
      );
    } catch (err: any) {
      alert(err?.message || "Failed to reject");
    } finally {
      setParticipationActionLoading(null);
    }
  };

  useEffect(() => {
    if (participationEventId && !participationsLoading) {
      const hasPending = participations.some(p => p.status === 'pending');
      setPendingEventIds(prev => {
        const next = new Set(prev);
        if (hasPending) next.add(participationEventId);
        else next.delete(participationEventId);
        return next;
      });
    }
  }, [participations, participationsLoading, participationEventId]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setImageError(t("file_size_limit"));
      return;
    }

    setImageError("");
    setIsUploading(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error(t("image_read_failed")));
        reader.readAsDataURL(file);
      });

      const result = await uploadImageByUrl(dataUrl);
      setNewEventImage(result.secure_url);
    } catch (error: any) {
      setImageError(error?.message || t("image_upload_failed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSelectImage = () => {
    editFileInputRef.current?.click();
  };

  const handleEditImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setImageError(t("file_size_limit"));
      return;
    }

    setImageError("");
    setIsUploading(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error(t("image_read_failed")));
        reader.readAsDataURL(file);
      });

      const result = await uploadImageByUrl(dataUrl);
      setEditFormData({ ...editFormData, imageURL: result.secure_url });
    } catch (error: any) {
      setImageError(error?.message || t("image_upload_failed"));
    } finally {
      setIsUploading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [data, pendingData] = await Promise.all([
        listAdminEvents(),
        listPendingParticipations()
      ]);
      setEvents(data);
      
      const pendingSet = new Set<string>();
      pendingData.forEach(p => {
        if (p.event && (typeof p.event === 'string' ? p.event : (p.event as any)._id)) {
           const eventId = typeof p.event === 'string' ? p.event : (p.event as any)._id;
           pendingSet.add(eventId);
        }
      });
      setPendingEventIds(pendingSet);

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

  const openView = (id: string) => {
    setSelectedId(id);
    setViewOpen(true);
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
          <p className="text-gray-600">{t("loading")}</p>
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
              <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-900">{t("admin_dashboard_title")}</Link>
              <Link to="/admin/users" className="text-gray-600 hover:text-gray-900">{t("users_manage")}</Link>
              <Link to="/admin/events" className="text-blue-600 font-medium">{t("events_manage")}</Link>
              <Link to="/admin/reports" className="text-gray-600 hover:text-gray-900">{t("reports_manage")}</Link>
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
            <h1 className="text-3xl font-bold mb-2">{t("events_manage")}</h1>
            <p className="text-gray-600">{t("manage_events_desc")}</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("create")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("create_new_event")}</DialogTitle>
                <DialogDescription>{t("enter_event_details")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("event_title")}</Label>
                  <Input
                    id="title"
                    placeholder={t("example_event_title")}
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">{t("event_date")}</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t("status_label")}</Label>
                    <select
                      className="w-full border rounded-md h-10 px-3"
                      value={newEventStatus}
                      onChange={(e) => setNewEventStatus(e.target.value as "active" | "draft")}
                    >
                      <option value="draft">{t("draft")}</option>
                      <option value="active">{t("published")}</option>
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">{t("start_time")}</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newEventStartTime}
                      onChange={(e) => setNewEventStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">{t("end_time")}</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newEventEndTime}
                      onChange={(e) => setNewEventEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">{t("location_label")}</Label>
                  <Input
                    id="location"
                    placeholder={t("example_location")}
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t("details_label")}</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder={t("placeholder_event_details")}
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">{t("event_image")}</Label>
                  <input
                    ref={fileInputRef}
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleSelectImage}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors"
                  >
                    {newEventImage ? (
                      <img
                        src={newEventImage}
                        alt="Event preview"
                        className="mx-auto h-32 object-contain rounded-md"
                      />
                    ) : (
                      <>
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">{isUploading ? t("uploading") : t("click_to_upload_image")}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          PNG, JPG, GIF (最大 5MB)
                        </p>
                      </>
                    )}
                  </button>
                  {imageError && <p className="text-xs text-red-600">{imageError}</p>}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    disabled={!newEventTitle.trim() || !newEventDate.trim() || !newEventLocation.trim()}
                    onClick={handleCreateEvent}
                  >
                    {t("create")}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    {t("cancel")}
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
                <CardTitle className="text-sm font-medium text-gray-600">{t("total_events")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalEvents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">{t("published")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{activeEvents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">{t("draft")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-600">{draftEvents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">{t("total_participants")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalParticipants}</p>
            </CardContent>
          </Card>
        </div>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("events_list")}</CardTitle>
            <CardDescription>{t("manage_all_events")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("col_image")}</TableHead>
                  <TableHead>{t("col_title")}</TableHead>
                  <TableHead>{t("col_date")}</TableHead>
                  <TableHead>{t("col_organizer")}</TableHead>
                  <TableHead>{t("col_participants")}</TableHead>
                  <TableHead>{t("col_status")}</TableHead>
                  <TableHead>{t("col_actions")}</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(event.eventDate).toLocaleDateString("ja-JP")}
                      </div>
                    </TableCell>
                    <TableCell>{event.organizer?.name || "Unknown"}</TableCell>
                    <TableCell>{event.participants?.length || 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant={event.status === "active" ? "default" : "secondary"}
                        className={event.status === "active" ? "bg-green-500" : ""}
                      >
                        {event.status === "active" ? t("published") : t("draft")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                          <div className="relative">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => openParticipationDialog(event._id, event.title)}
                              aria-label="Manage participants"
                              title="参加申請管理"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            {pendingEventIds.has(event._id) && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openView(event._id)}
                            aria-label={t("view_details")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(event._id)}
                            aria-label={t("edit")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => openDelete(event._id)}
                            aria-label={t("delete")}
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
                {t("no_events_created")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("event_label")}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-4">
              {selected.imageURL && (
                <img
                  src={selected.imageURL}
                  alt={selected.title}
                  className="w-full h-64 object-cover rounded-md mb-4"
                />
              )}
              <div>
                <h3 className="text-2xl font-bold">{selected.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selected.eventDate).toLocaleDateString("ja-JP")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selected.startTime} - {selected.endTime}
                  </div>
                  <Badge variant={selected.status === "active" ? "default" : "secondary"}>
                    {selected.status === "active" ? t("published") : t("draft")}
                  </Badge>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-1">{t("location_label")}</h4>
                <p className="text-gray-600">{selected.location}</p>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-1">{t("details_label")}</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{selected.detail}</p>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-1">{t("col_organizer")}</h4>
                <div className="flex items-center gap-2">
                  {selected.organizer?.avatarURL ? (
                    <img src={selected.organizer.avatarURL} alt={selected.organizer.name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                      {selected.organizer?.name?.[0] || "?"}
                    </div>
                  )}
                  <span className="text-sm text-gray-600">{selected.organizer?.name || "Unknown"}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewOpen(false)}>
                  {t("close")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("edit_event")}</DialogTitle>
            <DialogDescription>{t("edit_event_description")}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("event_title")}</Label>
                <Input
                  value={editFormData.title || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("event_date")}</Label>
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
                  <Label>{t("status_label")}</Label>
                  <select
                    className="w-full border rounded-md h-10 px-3"
                    value={editFormData.status || "active"}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  >
                    <option value="active">{t("published")}</option>
                    <option value="draft">{t("draft")}</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("start_time")}</Label>
                  <Input
                    type="time"
                    value={editFormData.startTime || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("end_time")}</Label>
                  <Input
                    type="time"
                    value={editFormData.endTime || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("location_label")}</Label>
                <Input
                  value={editFormData.location || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("details_label")}</Label>
                <Textarea
                  rows={4}
                  value={editFormData.detail || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, detail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("event_image")}</Label>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleEditSelectImage}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors"
                >
                  {editFormData.imageURL ? (
                    <img
                      src={editFormData.imageURL}
                      alt="Event preview"
                      className="mx-auto h-32 object-contain rounded-md"
                    />
                  ) : (
                    <>
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">{isUploading ? t("uploading") : t("click_to_upload_image")}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG, GIF (最大 5MB)
                      </p>
                    </>
                  )}
                </button>
                {imageError && <p className="text-xs text-red-600">{imageError}</p>}
              </div>
              <DialogFooter>
                <Button onClick={handleUpdateEvent}>{t("save")}</Button>
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  {t("cancel")}
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
            <DialogTitle>{t("confirm_delete_event")}</DialogTitle>
            <DialogDescription>{t("delete_event_irreversible")}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="text-sm text-gray-700">
              {t("target")}: <span className="font-medium">{selected.title}</span>
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteEvent}>{t("delete")}</Button>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t("cancel")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Participation Management Dialog ── */}
      <Dialog open={participationDialogOpen} onOpenChange={setParticipationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("stat_pending_participations")}
            </DialogTitle>
            <DialogDescription>
              {participationEventTitle}
            </DialogDescription>
          </DialogHeader>

          {participationsLoading ? (
            <div className="p-6 text-center text-gray-500">{t("loading")}</div>
          ) : participations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">{t("no_pending_participations")}</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {participations.map((p) => (
                <div key={p._id} className="flex items-center gap-3 py-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.user.avatarURL ? (
                      <img src={p.user.avatarURL} alt={p.user.name} className="h-10 w-10 object-cover" />
                    ) : (
                      <span className="text-sm font-medium">{p.user.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{p.user.email}</p>
                    <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString("ja-JP")}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={participationActionLoading === p.user._id}
                          onClick={() => handleApproveParticipation(p.user._id)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          {t("approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          disabled={participationActionLoading === p.user._id}
                          onClick={() => handleRejectParticipation(p.user._id)}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          {t("reject")}
                        </Button>
                      </>
                    )}
                    {p.status === "approved" && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        {t("status_approved")}
                      </Badge>
                    )}
                    {p.status === "rejected" && (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        <X className="h-3 w-3 mr-1" />
                        {t("status_rejected")}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setParticipationDialogOpen(false)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
