import React, { useState, useRef, useEffect } from "react";
import { Globe, Lock } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getActiveLicense } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher({ className }) {
  const { lang, setLang, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // 1. Récupération et normalisation des langues de la licence active
  // (V22 : une licence embarque 1 ou plusieurs langues, plus une seule).
  const activeLicense = getActiveLicense();
  const licenseLangCodes = (activeLicense?.languages || []).map((l) => l.toLowerCase());

  const availableLanguages = licenseLangCodes.length > 0
    ? languages.filter((l) => licenseLangCodes.includes(l.code.toLowerCase()))
    : languages;

  // Verrouillé uniquement si la licence n'autorise qu'UNE seule langue.
  // Si elle en autorise plusieurs, le sélecteur reste ouvert mais restreint
  // à cet ensemble.
  const forcedLangCode = licenseLangCodes.length === 1 ? availableLanguages[0]?.code : null;
  const isLocked = Boolean(forcedLangCode);

  const isCurrentAllowed = availableLanguages.some((l) => l.code.toLowerCase() === lang?.toLowerCase());
  const activeCode = forcedLangCode || (isCurrentAllowed ? lang : availableLanguages[0]?.code) || lang;
  const current = languages.find((l) => l.code.toLowerCase() === activeCode?.toLowerCase()) || languages[0];

  // 2. Synchronisation de la langue avec le contexte global sans boucle
  useEffect(() => {
    if (activeCode && lang.toLowerCase() !== activeCode.toLowerCase()) {
      setLang(activeCode);
    }
  }, [activeCode, lang, setLang]);

  // 3. Fermeture du menu au clic extérieur
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        onClick={() => !isLocked && setOpen((o) => !o)}
        disabled={isLocked}
        title={isLocked ? `Langue verrouillée par la licence (${current?.label})` : ""}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl bg-void-panel/70 border border-void-border text-sm font-semibold text-parchment transition-colors",
          isLocked
            ? "opacity-75 cursor-not-allowed border-white/5"
            : "hover:border-gold-dim cursor-pointer"
        )}
      >
        {isLocked ? (
          <Lock size={14} className="text-gold-dim shrink-0" />
        ) : (
          <Globe size={16} className="text-gold shrink-0" />
        )}
        <span>{current?.flag}</span>
        <span className="hidden sm:inline">{current?.label}</span>
      </button>

      {!isLocked && open && (
        <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-44 bg-void-panel border border-void-border rounded-xl shadow-glow overflow-hidden z-30 card-seal">
          {availableLanguages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors",
                lang.toLowerCase() === l.code.toLowerCase() ? "text-gold-bright font-bold" : "text-parchment"
              )}
            >
              <span>{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}