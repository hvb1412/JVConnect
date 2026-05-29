import { Button } from "./ui/button";
import { Globe } from "lucide-react";
import { useLanguage } from "../lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const nextLang = lang === "ja" ? "vi" : "ja";
  const nextLangLabel = nextLang === "ja" ? "日本語" : "Tiếng Việt";

  const toggleLanguage = () => {
    setLang(nextLang);
  };

  return (
    <Button variant="outline" size="sm" onClick={toggleLanguage} className="flex items-center gap-2">
      <Globe className="w-4 h-4" />
      <span>{nextLangLabel}</span>
    </Button>
  );
}
