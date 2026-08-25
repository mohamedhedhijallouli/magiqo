import React, { useState } from "react";
import { motion } from "framer-motion";
import { Satellite, Radar, Rocket, Eye } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

// Équivalent de ObjectCard.jsx pour l'archétype "dashboard" (Centre de
// Commandement Spatial) : une fiche de mission façon interface de
// vaisseau plutôt qu'une carte d'enquête ou de carnet. Même contrat de
// props que l'original.
export default function DashboardObjectCard({ gameObject, difficulty, stepNumber, totalSteps, onHintUsed }) {
  const { t } = useLanguage();
  const [showHint, setShowHint] = useState(false);

  const enigma = gameObject[`enigma_${difficulty}`] || gameObject.enigma_explorateur;
  const mission = gameObject[`mission_${difficulty}`] || gameObject.mission_explorateur;
  const hint = gameObject[`hint_${difficulty}`] || gameObject.hint_explorateur;

  function revealHint() {
    if (showHint) return;
    setShowHint(true);
    onHintUsed?.();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="relative bg-void-panel/90 border border-arcane/40 rounded-lg px-6 pt-6 pb-6">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-arcane via-gold to-emerald opacity-70" />

        <div className="flex items-center justify-between mb-5 pt-2">
          <span className="text-4xl">{gameObject.emoji || "🛰️"}</span>
          <div className="flex items-center gap-1.5 text-arcane font-rune text-[11px] tracking-widest border border-arcane/40 rounded px-3 py-1">
            <Radar size={12} /> {t("dashboard_module")} {stepNumber}/{totalSteps}
          </div>
        </div>

        <h3 className="font-display text-xl text-gold-bright mb-5">
          {gameObject.displayName || gameObject.fantasy_name}
        </h3>

        <div className="mb-4">
          <div className="flex items-center gap-2 text-arcane font-rune text-[11px] uppercase tracking-widest mb-2">
            <Satellite size={14} /> {t("dashboard_scan")}
          </div>
          <p className="text-parchment/90 leading-relaxed border-l-2 border-arcane/40 pl-3 py-1 font-rune">{enigma}</p>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-ember-bright font-rune text-[11px] uppercase tracking-widest mb-2">
            <Rocket size={14} /> {t("dashboard_directive")}
          </div>
          <p className="text-parchment/90 leading-relaxed border-l-2 border-ember/40 pl-3 py-1 font-rune">{mission}</p>
        </div>

        {!showHint ? (
          <button
            type="button"
            onClick={revealHint}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-arcane/40 text-arcane text-xs uppercase tracking-widest font-rune py-2 rounded hover:border-arcane hover:text-gold transition-colors"
          >
            <Eye size={14} />
            {t("oc_hint_show")}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={cn("bg-void/60 border border-arcane/40 rounded p-3 text-sm text-parchment font-rune")}
          >
            <p className="font-rune text-[9px] tracking-widest text-arcane mb-1">{t("dashboard_ai_note")}</p>
            <div className="flex items-start gap-2">
              <Eye size={14} className="shrink-0 mt-0.5 text-gold" />
              {hint}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
