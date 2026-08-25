import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LANGUAGES, TRANSLATIONS } from "@/lib/i18n";

const LanguageContext = createContext(null);
const STORAGE_KEY = "magiqo:v1:lang";

// First-launch logic:
// - Browser language supported → preselect it silently.
// - Not supported → fall back to English and flag `isUnconfirmed` so the UI
//   can prompt the visitor to confirm/choose a language once.
function detectDefaultLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && TRANSLATIONS[stored]) return { lang: stored, isUnconfirmed: false };
  const nav = (navigator.language || "en").slice(0, 2);
  if (TRANSLATIONS[nav]) return { lang: nav, isUnconfirmed: false };
  return { lang: "en", isUnconfirmed: true };
}

export function LanguageProvider({ children }) {
  const initial = useMemo(detectDefaultLang, []);
  const [lang, setLangState] = useState(initial.lang);
  const [isUnconfirmed, setIsUnconfirmed] = useState(initial.isUnconfirmed);

  const meta = useMemo(() => LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0], [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
  }, [lang, meta]);

  const setLang = (code) => {
    if (!TRANSLATIONS[code]) return;
    localStorage.setItem(STORAGE_KEY, code);
    setLangState(code);
    setIsUnconfirmed(false);
  };

  const t = (key, vars) => {
	const dict = TRANSLATIONS[lang] || TRANSLATIONS.fr;
    let str = dict[key] ?? TRANSLATIONS.fr[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replaceAll(`{${k}}`, v);
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir: meta.dir, languages: LANGUAGES, isUnconfirmed }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
