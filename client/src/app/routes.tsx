import { createBrowserRouter, Navigate } from "react-router";
import { Landing } from "./screens/Landing";

function RootRedirect() {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/guest/login" replace />;
  const role = localStorage.getItem("role");
  return role === "admin"
    ? <Navigate to="/admin/dashboard" replace />
    : <Navigate to="/user/home" replace />;
}
import { GuestLogin } from "./screens/GuestLogin";
import { GuestRegister } from "./screens/GuestRegister";
import { GuestPasswordResetGuide } from "./screens/GuestPasswordResetGuide";
import { GuestOtpVerify } from "./screens/GuestOtpVerify";
import { GuestResetPassword } from "./screens/GuestResetPassword";
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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootRedirect,
  },
  // Guest App Routes
  {
    path: "/guest/login",
    Component: GuestLogin,
  },
  {
    path: "/guest/register",
    Component: GuestRegister,
  },
  {
    path: "/guest/forgot-password-guide",
    Component: GuestPasswordResetGuide,
  },
  {
    path: "/guest/otp-verify",
    Component: GuestOtpVerify,
  },
  {
    path: "/guest/reset-password",
    Component: GuestResetPassword,
  },
  // User App Routes
  {
    path: "/user/home",
    Component: UserHome,
  },
  {
    path: "/user/search",
    Component: UserSearch,
  },
  {
    path: "/user/friends",
    Component: UserFriends,
  },
  {
    path: "/user/friend-requests",
    Component: UserFriendRequests,
  },
  {
    path: "/user/profile/:id",
    Component: UserProfile,
  },
  {
    path: "/user/chat/:id",
    Component: UserChat,
  },
  {
    path: "/user/chats",
    Component: UserChatsList,
  },
  {
    path: "/user/events",
    Component: UserEvents,
  },
  {
    path: "/user/events/:id",
    Component: UserEventDetail,
  },
  {
    path: "/user/events/joined",
    Component: UserJoinedEvents,
  },
  {
    path: "/user/mypage",
    Component: UserMyPage,
  },
  {
    path: "/user/reported",
    Component: UserReportRestricted,
  },
  // Admin App Routes
  {
    path: "/admin/dashboard",
    Component: AdminDashboard,
  },
  {
    path: "/admin/reports",
    Component: AdminReports,
  },
]);
