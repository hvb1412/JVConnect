import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Flag, Clock, CheckCircle, XCircle, Users, MessageCircle, CalendarCheck } from "lucide-react";
import { useTranslation } from "../lib/i18n";
import { initSocket } from "../lib/socket";

import {
  getEventById,
  joinEvent,
  cancelEvent,
  reportEvent,
  getMyParticipationStatus,
  ParticipationStatus,
} from "../lib/eventApi";

export function UserEventDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState(() => t("report_type_inappropriate"));
  const [detail, setDetail] = useState("");

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [participationStatus, setParticipationStatus] = useState<ParticipationStatus>("none");
  const [eventGroupConvId, setEventGroupConvId] = useState<string | null>(null);

  const currentUserId = localStorage.getItem("userId") || "";

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (!id) return;
        const [data, status] = await Promise.all([
          getEventById(id),
          getMyParticipationStatus(id),
        ]);
        setEvent(data);
        setParticipationStatus(status);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  // Listen for socket events: participation_approved / participation_rejected
  useEffect(() => {
    if (!currentUserId || !id) return;
    const socket = initSocket(currentUserId);
    if (!socket) return;

    const handleApproved = (payload: { eventId: string; groupConversationId?: string }) => {
      if (payload.eventId !== id) return;
      setParticipationStatus("approved");
      if (payload.groupConversationId) {
        setEventGroupConvId(payload.groupConversationId);
      }
    };

    const handleRejected = (payload: { eventId: string }) => {
      if (payload.eventId !== id) return;
      setParticipationStatus("rejected");
    };

    socket.on("participation_approved", handleApproved);
    socket.on("participation_rejected", handleRejected);

    return () => {
      socket.off("participation_approved", handleApproved);
      socket.off("participation_rejected", handleRejected);
    };
  }, [currentUserId, id]);

  const handleJoin = async () => {
    if (!event?._id) return;
    setActionLoading(true);
    try {
      await joinEvent(event._id);
      setParticipationStatus("pending");
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || "エラーが発生しました。");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!event?._id) return;
    setActionLoading(true);
    try {
      await cancelEvent(event._id);
      setParticipationStatus("none");
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || "エラーが発生しました。");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t("loading")}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t("event_not_found")}</p>
      </div>
    );
  }

  const isFull = event.participants >= event.maxParticipants;

  const renderParticipationButton = () => {
    switch (participationStatus) {
      case "none":
        return (
          <Button
            disabled={isFull || actionLoading}
            onClick={handleJoin}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CalendarCheck className="h-4 w-4 mr-2" />
            {actionLoading ? t("sending") : t("join_event_btn")}
          </Button>
        );

      case "pending":
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1.5 py-1.5 px-3">
              <Clock className="h-4 w-4" />
              {t("join_status_pending")}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600"
              disabled={actionLoading}
              onClick={handleCancel}
            >
              {t("cancel_button")}
            </Button>
          </div>
        );

      case "approved":
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1.5 py-1.5 px-3">
              <CheckCircle className="h-4 w-4" />
              {t("join_status_approved")}
            </Badge>
            {eventGroupConvId ? (
              <Button asChild size="sm" variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                <Link to={`/user/chat/${eventGroupConvId}`}>
                  <MessageCircle className="h-4 w-4 mr-1.5" />
                  {t("go_to_event_chat")}
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                disabled={actionLoading}
                onClick={handleCancel}
              >
                {t("leave_event")}
              </Button>
            )}
          </div>
        );

      case "rejected":
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1.5 py-1.5 px-3">
              <XCircle className="h-4 w-4" />
              {t("join_status_rejected")}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              disabled={isFull || actionLoading}
              onClick={handleJoin}
            >
              {t("join_again")}
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/user/home" className="text-gray-600 hover:text-gray-900">{t("nav_home")}</Link>
              <Link to="/user/search" className="text-gray-600 hover:text-gray-900">{t("nav_search")}</Link>
              <Link to="/user/friends" className="text-gray-600 hover:text-gray-900">{t("nav_friends")}</Link>
              <Link to="/user/events" className="text-blue-600 font-medium">{t("nav_events")}</Link>
              <Link to="/user/mypage" className="text-gray-600 hover:text-gray-900">{t("nav_mypage")}</Link>
            </nav>
          </div>
          <HeaderActions />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card>
          {/* Event image */}
          {event.imageURL ? (
            <img
              src={event.imageURL}
              alt={event.title}
              className="h-64 w-full object-cover rounded-t-lg"
            />
          ) : (
            <div className="h-64 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-t-lg flex items-center justify-center">
              <CalendarCheck className="h-16 w-16 text-white opacity-50" />
            </div>
          )}

          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle>{event.title}</CardTitle>
              <div className="text-sm text-gray-600 flex items-center gap-1 flex-shrink-0">
                <Users className="h-4 w-4" />
                {event.participants} / {event.maxParticipants} {t("participants")}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p>
              <span className="font-medium">{t("event_date")}:</span>{" "}
              {event.date}
            </p>
            <p>
              <span className="font-medium">{t("location_label")}:</span>{" "}
              {event.location}
            </p>
            {event.description && (
              <div>
                <p className="font-medium mb-2">{t("details_label")}</p>
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line bg-gray-50 rounded-lg p-4">
                  {event.description}
                </div>
              </div>
            )}

            {isFull && participationStatus === "none" && (
              <p className="text-sm text-red-600 font-medium">{t("event_full")}</p>
            )}

            {/* ── Participation status banner ── */}
            {participationStatus === "pending" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">{t("join_request_sent_title")}</p>
                    <p className="text-sm text-amber-700 mt-0.5">{t("join_request_sent_desc")}</p>
                  </div>
                </div>
              </div>
            )}

            {participationStatus === "approved" && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">{t("join_approved_title")}</p>
                    <p className="text-sm text-green-700 mt-0.5">{t("join_approved_desc")}</p>
                    {eventGroupConvId && (
                      <Link
                        to={`/user/chat/${eventGroupConvId}`}
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mt-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {t("go_to_event_chat")} →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {participationStatus === "rejected" && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">{t("join_rejected_title")}</p>
                    <p className="text-sm text-red-700 mt-0.5">{t("join_rejected_desc")}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 flex-wrap pt-2">
              {renderParticipationButton()}

              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="h-4 w-4 mr-2" />
                {t("report")}
              </Button>

              <Button asChild variant="ghost">
                <Link to="/user/events">{t("back")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Report dialog ── */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("report_event_title")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">{t("report_type_label")}</p>
              <select
                aria-label="Report reason"
                className="w-full border rounded-md h-10 px-3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value={t("report_type_inappropriate")}>{t("report_type_inappropriate")}</option>
                <option value={t("report_type_fake")}>{t("report_type_fake")}</option>
                <option value={t("report_type_spam")}>{t("report_type_spam")}</option>
                <option value={t("report_type_violence")}>{t("report_type_violence")}</option>
                <option value={t("report_type_other")}>{t("report_type_other")}</option>
              </select>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">{t("report_detail_label")}</p>
              <Textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder={t("report_detail_placeholder")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={async () => {
                try {
                  await reportEvent(event._id, `${reason}\n${detail}`);
                  setReportOpen(false);
                  setDetail("");
                  alert(t("report_received"));
                } catch (error) {
                  console.error(error);
                  alert(t("report_send_failed"));
                }
              }}
            >
              {t("send")}
            </Button>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              {t("cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}