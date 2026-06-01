import { Link } from "react-router";
import { useMemo, useState, useEffect } from "react";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Users, AlertTriangle, Calendar } from "lucide-react";
import { listUsers, toggleUserRestriction, listReports, listPendingParticipations, AdminUser, AdminReport, AdminParticipation } from "../lib/adminApi";
import { useTranslation } from "../lib/i18n";

export function AdminDashboard() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [participations, setParticipations] = useState<AdminParticipation[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersData, reportsData, participationsData] = await Promise.all([
          listUsers(),
          listReports(),
          listPendingParticipations(),
        ]);
        setUsers(usersData);
        setReports(reportsData);
        setParticipations(participationsData);
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
        title: t("stat_total_users"),
        value: users.length.toString(),
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        title: t("stat_total_reports"),
        value: reports.length.toString(),
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-100",
      },
      {
        title: t("stat_restricted_accounts"),
        value: users.filter((user) => user.isRestricted).length.toString(),
        icon: Calendar,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        title: t("stat_pending_participations"),
        value: participations.length.toString(),
        icon: Calendar,
        color: "text-amber-600",
        bgColor: "bg-amber-100",
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

  const recentParticipations = useMemo(() => {
    return participations.slice(0, 5);
  }, [participations]);

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
              <Link to="/admin/dashboard" className="text-blue-600 font-medium">{t("admin_dashboard_title")}</Link>
              <Link to="/admin/users" className="text-gray-600 hover:text-gray-900">{t("users_manage")}</Link>
              <Link to="/admin/events" className="text-gray-600 hover:text-gray-900">{t("events_manage")}</Link>
              <Link to="/admin/reports" className="text-gray-600 hover:text-gray-900">{t("reports_manage")}</Link>
              <Link to="/user/chats" className="text-gray-600 hover:text-gray-900">{t("messages_title", { defaultValue: "Tin nhắn" })}</Link>
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
          <h1 className="text-3xl font-bold mb-2">{t("admin_dashboard_title")}</h1>
          <p className="text-gray-600">{t("admin_dashboard_description")}</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>{t("recent_users_title")}</CardTitle>
              <CardDescription>{t("recent_users_description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={userSearchTerm}
                onChange={(event) => setUserSearchTerm(event.target.value)}
                placeholder={t("search_name_email")}
                className="mb-4"
              />
              <div className="space-y-4">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate" title={user.name}>{user.name}</p>
                        <p className="text-sm text-gray-600 truncate" title={user.email}>{user.email}</p>
                        <p className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                            user.isRestricted
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {user.isRestricted ? t("status_restricted") : t("status_active")}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLockToggle(user._id)}
                        >
                          {user.isRestricted ? t("unlock") : t("restrict")}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 bg-gray-50 rounded-lg">
                    {t("no_matching_users")}
                  </div>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/admin/users">{t("view_all_users")}</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
                <CardTitle>{t("latest_reports_title")}</CardTitle>
                <CardDescription>{t("reports_needing_processing")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.length > 0 ? (
                  recentReports.map((report) => (
                    <div
                      key={report._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                            {report.reportType}
                          </span>
                          <p className="font-semibold text-sm truncate" title={report.user?.name || report.event?.title || "Unknown"}>
                            {report.user?.name || report.event?.title || "Unknown"}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 truncate" title={report.reason}>{report.reason}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded whitespace-nowrap shrink-0">
                        {report.decision === 'pending' ? t("status_pending") : report.decision === 'approved' ? t("status_approved") : t("status_rejected")}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 bg-gray-50 rounded-lg">
                    {t("no_unprocessed_reports")}
                  </div>
                )}
              </div>
              <Button asChild className="w-full mt-4">
                <Link to="/admin/reports">{t("go_to_reports")}</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Participations Card */}
          <Card>
            <CardHeader>
                <CardTitle>{t("recent_participations_title")}</CardTitle>
                <CardDescription>{t("recent_participations_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentParticipations.length > 0 ? (
                  recentParticipations.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                            {t("event_label")}
                          </span>
                          <p className="font-semibold text-sm truncate" title={(p as any).event?.title || t("unknown")}>
                            {(p as any).event?.title || t("unknown")}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 truncate" title={`${p.user?.name} (${p.user?.email})`}>{p.user?.name} ({p.user?.email})</p>
                        <p className="text-xs text-gray-500">
                          {new Date(p.createdAt).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/admin/events">{t("check_button")}</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 bg-gray-50 rounded-lg">
                    {t("no_pending_participations")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
