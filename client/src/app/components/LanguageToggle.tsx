import { useState } from "react";
import { Button } from "./ui/button";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const [language, setLanguage] = useState<"ja" | "vi">("ja");

  const toggleLanguage = () => {
    setLanguage(language === "ja" ? "vi" : "ja");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
    >
      <Globe className="w-4 h-4" />
      <span>{language === "ja" ? "日本語" : "Tiếng Việt"}</span>
    </Button>
  );
}
