import React, { useState } from "react";
import { Label, Textarea } from "@/components/ui/Field";
import { useLanguage } from "@/lib/LanguageContext";
import { LEVELS } from "@/lib/gameData";
import { cn } from "@/lib/utils";

// V26 : les devinettes ne sont plus éditées ici — elles sont désormais une
// rubrique indépendante de l'administration (voir DevinettesManager /
// RiddleEditor) et se choisissent au niveau du PARCOURS, pas de l'objet/
// animal/lieu. Ce composant ne gère plus que l'énigme, l'indice et la
// mission propres à chaque tranche d'âge pour l'élément en cours d'édition.
export default function LevelContentEditor({ form, set }) {
  const { t } = useLanguage();
  const [level, setLevel] = useState("explorateur");

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {LEVELS.map((l) => (
          <button
            key={l.value}
            onClick={() => setLevel(l.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors flex items-center gap-1.5",
              level === l.value ? "border-gold-dim bg-gold/10 text-gold-bright" : "border-void-border text-muted"
            )}
          >
            <span>{l.emoji}</span> {t(l.labelKey)}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        <div>
          <Label>{t("oe_enigma")}</Label>
          <Textarea value={form[`enigma_${level}`] || ""} onChange={(e) => set(`enigma_${level}`, e.target.value)} rows={2} />
        </div>
        <div>
          <Label>{t("oe_hint")}</Label>
          <Textarea value={form[`hint_${level}`] || ""} onChange={(e) => set(`hint_${level}`, e.target.value)} rows={2} />
        </div>
        <div>
          <Label>{t("oe_mission")}</Label>
          <Textarea value={form[`mission_${level}`] || ""} onChange={(e) => set(`mission_${level}`, e.target.value)} rows={2} />
        </div>
      </div>
    </div>
  );
}
