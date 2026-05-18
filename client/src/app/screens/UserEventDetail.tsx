import { Link, useParams } from "react-router";
import { useEffect, useState } from "react";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Flag } from "lucide-react";

import {
  getEventById,
  joinEvent,
  cancelEvent,
  reportEvent,
} from "../lib/eventApi";

export function UserEventDetail() {
  const { id } = useParams();

  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("不適切な内容");
  const [detail, setDetail] = useState("");
  const [joined, setJoined] = useState(false);

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (!id) return;

        const data = await getEventById(id);

        setEvent(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!event) {
    return <div className="p-6">Event not found</div>;
  }

  const isFull =
    event.participants >= event.maxParticipants;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/user/home">ホーム</Link>
              <Link to="/user/search">検索</Link>
              <Link to="/user/friends">フレンド</Link>
              <Link
                to="/user/events"
                className="text-blue-600 font-medium"
              >
                イベント
              </Link>
              <Link to="/user/mypage">マイページ</Link>
            </nav>
          </div>

          <LanguageToggle />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card>
          <div className="h-64 bg-gray-200 rounded-t-lg" />

          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle>イベント詳細</CardTitle>

              <div className="text-sm text-gray-600">
                {event.participants} / {event.maxParticipants} 人
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p>
              <span className="font-medium">タイトル:</span>{" "}
              {event.title}
            </p>

            <p>
              <span className="font-medium">日時:</span>{" "}
              {event.date}
            </p>

            <p>
              <span className="font-medium">場所:</span>{" "}
              {event.location}
            </p>

            <div>
              <p className="font-medium mb-2">説明</p>

              <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            </div>

            {isFull && (
              <p className="text-sm text-red-600">
                定員に達しました
              </p>
            )}

            <div className="flex gap-2">
              {!joined ? (
                <Button
                  disabled={isFull}
                  onClick={async () => {
                    try {
                      await joinEvent(event._id);

                      setJoined(true);

                      setEvent({
                        ...event,
                        participants: event.participants + 1,
                      });
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                >
                  参加する
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await cancelEvent(event._id);

                      setJoined(false);

                      setEvent({
                        ...event,
                        participants: event.participants - 1,
                      });
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                >
                  キャンセル
                </Button>
              )}

              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="h-4 w-4 mr-2" />
                通報
              </Button>

              <Button asChild variant="ghost">
                <Link to="/user/events">戻る</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>イベント通報</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">
                理由
              </p>

              <select
                aria-label="Report reason"
                className="w-full border rounded-md h-10 px-3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option>不適切な内容</option>
                <option>虚偽のイベント情報</option>
                <option>スパム</option>
                <option>危険な内容</option>
                <option>その他</option>
              </select>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">
                詳細
              </p>

              <Textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="詳細を入力してください"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={async () => {
                try {
                  await reportEvent(
                    event._id,
                    `${reason}\n${detail}`
                  );

                  setReportOpen(false);

                  setDetail("");
                } catch (error) {
                  console.error(error);
                }
              }}
            >
              送信
            </Button>

            <Button
              variant="outline"
              onClick={() => setReportOpen(false)}
            >
              キャンセル
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}