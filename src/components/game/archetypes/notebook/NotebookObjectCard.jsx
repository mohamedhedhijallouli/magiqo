import React, { useState } from "react";
import { motion } from "framer-motion";
import { PenLine, Binoculars, ClipboardList, Eye } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

// Équivalent de ObjectCard.jsx pour l'archétype "notebook" (Carnet du
// Patrimoine, Carnet du Zoologiste) : une fiche de terrain avec coins de
// ruban washi, plutôt qu'une carte d'enquête ou de carte au trésor. Même
// contrat de props que l'original.
export default function NotebookObjectCard({ gameObject, difficulty, stepNumber, totalSteps, onHintUsed }) {
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
      initial={{ opacity: 0, y: 16, rotate: 0.8 }}
      animate={{ opacity: 1, y: 0, rotate: 0.8 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="relative bg-parchment/95 text-void rounded-md border border-void-border/30 shadow-[0_16px_36px_rgba(0,0,0,0.4)] px-6 pt-7 pb-6">
        {/* Rubans washi aux coins */}
        <div className="absolute -top-2 -left-3 w-14 h-6 bg-emerald/40 rotate-[-10deg] rounded-sm" />
        <div className="absolute -top-2 -right-3 w-14 h-6 bg-gold/40 rotate-[10deg] rounded-sm" />

        <div className="flex items-center justify-between mb-5">
          <span className="text-4xl">{gameObject.emoji || "🔎"}</span>
          <div className="flex items-center gap-1.5 text-void/50 font-rune text-[11px] tracking-widest">
            <ClipboardList size={12} /> {t("notebook_sheet")} {stepNumber}/{totalSteps}
          </div>
        </div>

        <h3 className="font-display text-xl text-void mb-5">{gameObject.displayName || gameObject.fantasy_name}</h3>

        <div className="mb-4">
          <div className="flex items-center gap-2 text-void/70 font-rune text-[11px] uppercase tracking-widest mb-2">
            <Binoculars size={14} /> {t("notebook_field_note")}
          </div>
          <p className="font-body text-void/90 leading-relaxed border-l-2 border-void/25 pl-3 py-1 italic">{enigma}</p>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-emerald font-rune text-[11px] uppercase tracking-widest mb-2">
            <PenLine size={14} /> {t("notebook_to_find")}
          </div>
          <p className="font-body text-void/90 leading-relaxed border-l-2 border-emerald/40 pl-3 py-1">{mission}</p>
        </div>

        {!showHint ? (
          <button
            type="button"
            onClick={revealHint}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-void/30 text-void/60 text-xs uppercase tracking-widest font-rune py-2 hover:border-void/60 hover:text-void transition-colors"
          >
            <Eye size={14} />
            {t("oc_hint_show")}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={cn("bg-void/5 border border-void/20 rounded-md p-3 text-sm text-void/90")}
          >
            <p className="font-rune text-[9px] tracking-widest text-void/40 mb-1">{t("notebook_margin_note")}</p>
            <div className="flex items-start gap-2">
              <Eye size={14} className="shrink-0 mt-0.5 text-void/60" />
              {hint}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
