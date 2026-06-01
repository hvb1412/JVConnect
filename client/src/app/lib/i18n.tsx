import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { updateUserProfile } from "./userApi";
import { translations as allTranslations } from "./translations";

type Lang = "ja" | "vi";

const STORAGE_KEY = "jvconnect-lang";

// merge our small translations map with larger per-screen translations
const translations: Record<string, Record<Lang, string>> = {
  logout: { ja: "ログアウト", vi: "Đăng xuất" },
  language_name: { ja: "日本語", vi: "Tiếng Việt" },
  ...Object.keys(allTranslations.ja).reduce((acc, key) => {
    acc[key] = { ja: (allTranslations as any).ja[key], vi: (allTranslations as any).vi[key] };
    return acc;
  }, {} as Record<string, Record<Lang, string>>),
};

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
}>({ lang: "ja", setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw === "ja" || raw === "vi") return raw;
      return "ja";
    } catch {
      return "ja";
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, [lang]);

  const setLang = async (l: Lang) => {
    setLangState(l);
    // If logged in, attempt to persist preference to backend
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      if (token) {
        await updateUserProfile({ language: l });
      }
    } catch (err) {
      // ignore errors — persistence is best-effort
      // console.error('Failed to persist language', err);
    }
  };

  const value = useMemo(() => ({ lang, setLang }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function useTranslation() {
  const { lang } = useLanguage();
  const t = (key: string) => {
    const item = translations[key];
    if (!item) return key;
    return item[lang] || key;
  };
  return { t, lang } as const;
}

export function getStoredLanguage(): Lang {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw === "ja" || raw === "vi") return raw;
    return "ja";
  } catch {
    return "ja";
  }
}
