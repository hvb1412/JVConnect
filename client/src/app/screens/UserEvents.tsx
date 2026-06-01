import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { useTranslation } from "../lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar, MapPin, Users, CheckCircle2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { isEventContentHidden } from "../lib/contentModerationStore";
import { getAllEvents, UiEvent } from "../lib/eventApi";

export function UserEvents() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<UiEvent | null>(null);

  useEffect(() => {
    getAllEvents().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const visibleEvents = events.filter((event) => !isEventContentHidden(event.title));
  
  // To avoid midnight issues, we just check day start. For simplicity, just Date.now() works fine.
  const now = Date.now();
  const upcomingEvents = visibleEvents.filter((e) => {
    const d = new Date(e.eventDateRaw);
    return !isNaN(d.getTime()) && d.getTime() >= now - 86400000; // allow today
  });
  const pastEvents = visibleEvents.filter((e) => {
    const d = new Date(e.eventDateRaw);
    return !isNaN(d.getTime()) && d.getTime() < now - 86400000;
  });

  const currentList = activeTab === "all" ? visibleEvents : activeTab === "upcoming" ? upcomingEvents : pastEvents;

  useEffect(() => {
    if (currentList.length > 0 && (!selectedEvent || !currentList.find(e => e.id === selectedEvent.id))) {
      setSelectedEvent(currentList[0]);
    } else if (currentList.length === 0) {
      setSelectedEvent(null);
    }
  }, [activeTab, events]); // Only run when tab or events load changes

  const renderEventList = (list: UiEvent[]) => {
    if (loading) {
      return (
        <Card>
          <CardContent className="p-6 text-sm text-gray-600 text-center py-12">
            {t("loading")}
          </CardContent>
        </Card>
      );
    }

    if (list.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-sm text-gray-600 text-center py-12">
            {t("no_events_available")}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Event List */}
        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 pb-4 custom-scrollbar">
          {list.map((event) => (
            <Card
              key={event.id}
              className={`cursor-pointer transition-all ${
                selectedEvent?.id === event.id
                  ? "ring-2 ring-blue-500 shadow-md"
                  : "hover:shadow-md"
              }`}
              onClick={() => setSelectedEvent(event)}
            >
              <div className="flex">
                <div className="w-32 h-32 flex-shrink-0">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover rounded-l-lg"
                  />
                </div>
                <CardContent className="flex-1 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary">{event.category}</Badge>
                    {event.isJoined && (
                      <Badge className="bg-green-600 hover:bg-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        {t("joined")}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-2 line-clamp-1">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>

        {/* Event Details */}
        <div className="lg:sticky lg:top-24 h-fit">
          {selectedEvent ? (
            <Card>
              <div className="w-full h-64">
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedEvent.category}</Badge>
                    {selectedEvent.isJoined && (
                      <Badge className="bg-green-600 hover:bg-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        {t("joined")}
                      </Badge>
                    )}
                  </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{selectedEvent.participants} {t("participants")}</span>
                  </div>
                </div>
                <CardTitle className="text-2xl">{selectedEvent.title}</CardTitle>
                <CardDescription className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4" />
                    <span>{selectedEvent.date} {selectedEvent.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">{t("details")}</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {selectedEvent.description || t("no_description")}
                  </p>
                </div>
                <div className="mb-6">
                  <h3 className="font-semibold mb-1">{t("col_organizer")}</h3>
                  <p className="text-gray-700">{selectedEvent.organizer}</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link to={`/user/events/${selectedEvent.id}`}>{t("view_details")}</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/user/events/joined">{t("joined_events")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center text-gray-500">
              {t("select_event_prompt")}
            </Card>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
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
          <div className="flex items-center gap-4">
            <HeaderActions />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("events_title")}</h1>
          <p className="text-gray-600">{t("events_subtitle")}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="all">{t("tab_all")}</TabsTrigger>
            <TabsTrigger value="upcoming">{t("tab_upcoming")}</TabsTrigger>
            <TabsTrigger value="past">{t("tab_past")}</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {renderEventList(visibleEvents)}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            {renderEventList(upcomingEvents)}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {renderEventList(pastEvents)}
          </TabsContent>
        </Tabs>

        <Button asChild variant="outline" className="mt-6">
          <Link to="/user/home">{t("back_to_home")}</Link>
        </Button>
      </div>
    </div>
  );
}
