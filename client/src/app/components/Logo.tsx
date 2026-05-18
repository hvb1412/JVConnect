import { Building2 } from "lucide-react";
import { Link, useLocation } from "react-router";

export function Logo() {
  const location = useLocation();
  
  let targetPath = "/";
  if (location.pathname.startsWith("/user")) {
    targetPath = "/user/home";
  } else if (location.pathname.startsWith("/admin")) {
    targetPath = "/admin/dashboard";
  }

  return (
    <Link to={targetPath} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
        <Building2 className="w-6 h-6 text-white" />
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        JV Connect
      </span>
    </Link>
  );
}
