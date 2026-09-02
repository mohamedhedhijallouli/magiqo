import React, { useState } from "react";
import { motion } from "framer-motion";
import { Swords, Shield, Flame, Eye } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

// Équivalent de ObjectCard.jsx pour l'archétype "arena" (Arène Romaine) :
// une épreuve de gladiateur plutôt qu'une fiche d'enquête ou de carte au
// trésor. Même contrat de props que l'original.
export default function ArenaObjectCard({ gameObject, difficulty, stepNumber, totalSteps, onHintUsed }) {
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
      <div className="relative bg-void-panel/90 border border-gold-dim/40 rounded-xl px-6 pt-7 pb-6" style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}>
        <div className="flex items-center justify-between mb-5">
          <span className="text-4xl">{gameObject.emoji || "⚔️"}</span>
          <div className="flex items-center gap-1.5 text-gold-dim font-rune text-[11px] tracking-widest border border-gold-dim/40 px-3 py-1"
               style={{ clipPath: "polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)" }}>
            <Shield size={12} /> {t("arena_trial")} {stepNumber}/{totalSteps}
          </div>
        </div>

        <h3 className="font-display text-xl text-gold-bright text-center mb-5 uppercase tracking-wide">
          {gameObject.displayName || gameObject.fantasy_name}
        </h3>

        <div className="mb-4">
          <div className="flex items-center gap-2 text-arcane font-rune text-[11px] uppercase tracking-widest mb-2">
            <Eye size={14} /> {t("arena_challenge")}
          </div>
          <p className="text-parchment/90 leading-relaxed border-l-2 border-arcane/40 pl-3 py-1">{enigma}</p>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-ember-bright font-rune text-[11px] uppercase tracking-widest mb-2">
            <Swords size={14} /> {t("arena_task")}
          </div>
          <p className="text-parchment/90 leading-relaxed border-l-2 border-ember/40 pl-3 py-1">{mission}</p>
        </div>

        {!showHint ? (
          <button
            type="button"
            onClick={revealHint}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-gold-dim/50 text-gold-dim text-xs uppercase tracking-widest font-rune py-2 hover:border-gold-dim hover:text-gold transition-colors"
          >
            <Flame size={14} />
            {t("oc_hint_show")}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={cn("bg-void/60 border border-gold-dim/40 p-3 text-sm text-parchment")}
          >
            <p className="font-rune text-[9px] tracking-widest text-gold-dim mb-1">{t("arena_lanista_advice")}</p>
            <div className="flex items-start gap-2">
              <Flame size={14} className="shrink-0 mt-0.5 text-ember" />
              {hint}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
