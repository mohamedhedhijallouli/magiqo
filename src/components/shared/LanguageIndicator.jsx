import React from "react";
import { Languages } from "lucide-react";
import { getActiveLicense } from "@/lib/auth";
import { LANGUAGES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Indique — et permet de choisir — la langue d'un objet/animal/lieu. Cette
// langue sert ensuite, dans l'éditeur de parcours, à ne proposer aux
// tuteurs que le contenu déjà écrit dans LEUR langue de travail (ex : un
// tuteur russe ne voit que les objets/animaux/lieux marqués "russe").
// Restreint aux langues incluses dans la licence active, comme pour le
// choix de langue d'un tuteur.
export default function LanguageIndicator({ value, onChange, className }) {
  const activeLicense = getActiveLicense();
  const licenseLangCodes = (activeLicense?.languages || ["FR"]).map((l) => l.toLowerCase());
  const options = LANGUAGES.filter((l) => licenseLangCodes.includes(l.code.toLowerCase()));
  const current = options.find((l) => l.code.toLowerCase() === (value || "").toLowerCase()) || options[0];

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Languages size={13} className="text-muted shrink-0" />
      {options.map((l) => {
        const active = current?.code === l.code;
        return (
          <button
            type="button"
            key={l.code}
            onClick={() => onChange(l.code.toUpperCase())}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-colors",
              active ? "bg-gold/15 border-gold-dim text-gold-bright" : "bg-void/40 border-void-border text-muted hover:border-white/25"
            )}
          >
            <span>{l.flag}</span> {l.label}
          </button>
        );
      })}
    </div>
  );
}
