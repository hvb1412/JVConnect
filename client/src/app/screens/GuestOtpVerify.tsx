import React from "react";
import { Navigate, useLocation } from "react-router";

export function GuestOtpVerify() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const email = params.get("email") ?? "your.email@example.com";

  return <Navigate to={`/guest/login?forgot=1&step=otp&email=${encodeURIComponent(email)}`} replace />;
}
