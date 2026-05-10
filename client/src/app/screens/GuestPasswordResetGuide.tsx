import React from "react";
import { Navigate, useLocation } from "react-router";

export function GuestPasswordResetGuide() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const email = params.get("email") ?? "your.email@example.com";

  return <Navigate to={`/guest/login?forgot=1&step=guide&email=${encodeURIComponent(email)}`} replace />;
}
