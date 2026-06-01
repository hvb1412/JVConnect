import { createBrowserRouter, Navigate, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Landing } from "./screens/Landing";
import axios from "axios";
import { toast } from "sonner";
import { initSocket, disconnectSocket, getSocket } from "./lib/socket";

// ─── Guards ──────────────────────────────────────────────────────────────────

function RootRedirect() {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/guest/login" replace />;
    const role = localStorage.getItem("role");
    return role === "admin"
        ? <Navigate to="/admin/dashboard" replace />
        : <Navigate to="/user/home" replace />;
}

/**
 * Wraps any user page.
 * - If not logged in → /guest/login
 * - If account is banned → /user/reported
 * - Otherwise renders children
 */
function UserGuard({ children }: { children: React.ReactNode }) {
    // ⚠️ All hooks MUST be called before any conditional return
    const [status, setStatus] = useState<"checking" | "ok" | "banned" | "no-token">("checking");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setStatus("no-token");
            return;
        }

        axios
            .get(`${import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.startsWith("http") ? import.meta.env.VITE_API_URL : `https://${import.meta.env.VITE_API_URL}`) : "http://localhost:3000"}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                const data = res.data?.data;
                if (!data) { setStatus("ok"); return; }

                const { isRestricted, restrictedUntil } = data;
                if (!isRestricted) { setStatus("ok"); return; }

                // Permanent ban
                if (!restrictedUntil) { setStatus("banned"); return; }

                // Temporary ban still active?
                if (new Date(restrictedUntil) > new Date()) {
                    setStatus("banned");
                } else {
                    setStatus("ok");
                }
            })
            .catch(() => {
                // /me failed → just let through, other guards handle auth
                setStatus("ok");
            });
    }, []);

    if (status === "checking") return null;
    if (status === "no-token") return <Navigate to="/guest/login" replace />;
    if (status === "banned") return <Navigate to="/user/reported" replace />;
    return <>{children}</>;
}

/**
 * Wraps any admin page.
 * - If not logged in → /guest/login
 * - If not admin → /user/home
 * - Otherwise renders children
 */
function AdminGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<"checking" | "ok" | "no-token" | "not-admin">("checking");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setStatus("no-token");
            return;
        }

        axios
            .get(`${import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.startsWith("http") ? import.meta.env.VITE_API_URL : `https://${import.meta.env.VITE_API_URL}`) : "http://localhost:3000"}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                const role = res.data?.data?.role;
                const userId = res.data?.data?._id;
                if (role === "admin") {
                    setStatus("ok");
                    if (userId) {
                        const socket = initSocket(userId);
                        if (socket) {
                            socket.off("new_participation_request");
                            socket.on("new_participation_request", (payload: any) => {
                                toast.info(`新しい参加申請があります`, {
                                    description: `${payload.userName} さんが「${payload.eventTitle}」に申請しました。`,
                                    action: {
                                        label: "確認",
                                        onClick: () => navigate("/admin/events"),
                                    },
                                });
                            });
                        }
                    }
                } else {
                    setStatus("not-admin");
                }
            })
            .catch(() => {
                const cachedRole = localStorage.getItem("role");
                setStatus(cachedRole === "admin" ? "ok" : "not-admin");
            });
            
        return () => {
            try {
                const socket = getSocket();
                if (socket) {
                    socket.off("new_participation_request");
                }
            } catch (e) {
                // Ignore if socket not initialized
            }
        };
    }, []);

    if (status === "checking") return null;
    if (status === "no-token") return <Navigate to="/guest/login" replace />;
    if (status === "not-admin") return <Navigate to="/user/home" replace />;
    return <>{children}</>;
}

// ─── Screen imports ───────────────────────────────────────────────────────────

import { GuestLogin } from "./screens/GuestLogin";
import { GuestRegister } from "./screens/GuestRegister";
import { GuestForgotPassword } from "./screens/GuestForgotPassword";
import { UserHome } from "./screens/UserHome";
import { UserSearch } from "./screens/UserSearch";
import { UserProfile } from "./screens/UserProfile";
import { UserChat } from "./screens/UserChat";
import { UserChatsList } from "./screens/UserChatsList";
import { UserEvents } from "./screens/UserEvents";
import { UserMyPage } from "./screens/UserMyPage";
import { UserFriends } from "./screens/UserFriends";
import { UserFriendRequests } from "./screens/UserFriendRequests";
import { UserEventDetail } from "./screens/UserEventDetail";
import { UserJoinedEvents } from "./screens/UserJoinedEvents";
import { UserReportRestricted } from "./screens/UserReportRestricted";
import { AdminDashboard } from "./screens/AdminDashboard";
import { AdminReports } from "./screens/AdminReports";
import { AdminUsers } from "./screens/AdminUsers";
import { AdminEvents } from "./screens/AdminEvents";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function G(Component: React.ComponentType) {
    return () => (
        <UserGuard>
            <Component />
        </UserGuard>
    );
}

function A(Component: React.ComponentType) {
    return () => (
        <AdminGuard>
            <Component />
        </AdminGuard>
    );
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
    { path: "/", Component: RootRedirect },

    // Guest
    { path: "/guest/login", Component: GuestLogin },
    { path: "/guest/register", Component: GuestRegister },
    { path: "/guest/forgot-password", Component: GuestForgotPassword },

    // User — all wrapped with UserGuard (ban check)
    { path: "/user/home", Component: G(UserHome) },
    { path: "/user/search", Component: G(UserSearch) },
    { path: "/user/friends", Component: G(UserFriends) },
    { path: "/user/friend-requests", Component: G(UserFriendRequests) },
    { path: "/user/profile/:id", Component: G(UserProfile) },
    { path: "/user/chat/:id", Component: G(UserChat) },
    { path: "/user/chats", Component: G(UserChatsList) },
    { path: "/user/events", Component: G(UserEvents) },
    { path: "/user/events/:id", Component: G(UserEventDetail) },
    { path: "/user/events/joined", Component: G(UserJoinedEvents) },
    { path: "/user/mypage", Component: G(UserMyPage) },

    // Ban page — no guard (so banned users can see it)
    { path: "/user/reported", Component: UserReportRestricted },

    // Admin
    { path: "/admin/dashboard", Component: A(AdminDashboard) },
    { path: "/admin/reports", Component: A(AdminReports) },
    { path: "/admin/users", Component: A(AdminUsers) },
    { path: "/admin/events", Component: A(AdminEvents) },
]);
