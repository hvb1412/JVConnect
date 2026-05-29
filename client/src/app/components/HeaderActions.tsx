import { useNavigate } from "react-router";
import { LanguageToggle } from "./LanguageToggle";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { logout } from "../lib/authApi";
import { useTranslation } from "../lib/i18n";

export function HeaderActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate("/guest/login", { replace: true });
  };

  return (
    <div className="flex items-center gap-2">
      <LanguageToggle />
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">{t("logout")}</span>
      </Button>
    </div>
  );
}
