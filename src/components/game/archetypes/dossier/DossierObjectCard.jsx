import React, { useState } from "react";
import { motion } from "framer-motion";
import { Paperclip, Search, Target, Eye } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

// Équivalent de ObjectCard.jsx pour le World "Dossier Classifié" — même
// contrat de props (gameObject, difficulty, stepNumber, totalSteps,
// onHintUsed), mais présenté comme une fiche de rapport d'enquête plutôt
// qu'une carte fantastique : tampon, trombone, mentions tapées à la
// machine. C'est ce fichier, et non un simple changement de couleur, qui
// donne au joueur l'impression de vraiment changer d'univers.
export default function DossierObjectCard({ gameObject, difficulty, stepNumber, totalSteps, onHintUsed }) {
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
      initial={{ opacity: 0, y: 16, rotate: -0.6 }}
      animate={{ opacity: 1, y: 0, rotate: -0.6 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="relative bg-parchment/95 text-void rounded-sm border border-void-border/40 shadow-[0_18px_40px_rgba(0,0,0,0.45)] px-6 pt-8 pb-6">
        {/* Trombone */}
        <Paperclip
          size={34}
          strokeWidth={1.5}
          className="absolute -top-3 left-6 text-void-border -rotate-[20deg] drop-shadow"
        />

        {/* Tampon "DOSSIER N°" */}
        <div className="absolute top-4 right-4 rotate-[8deg] border-2 border-ember/70 text-ember/80 font-rune text-[10px] tracking-widest px-2 py-1 rounded-sm select-none">
          {t("oc_step")} {stepNumber} / {totalSteps}
        </div>

        <div className="flex items-center gap-3 mb-5 border-b border-void/20 pb-3">
          <span className="text-4xl grayscale contrast-125">{gameObject.emoji || "📁"}</span>
          <div>
            <p className="font-rune text-[10px] uppercase tracking-[0.2em] text-void/50">{t("dossier_report_ref")}</p>
            <h3 className="font-display text-xl text-void">{gameObject.displayName || gameObject.fantasy_name}</h3>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 text-void/70 font-rune text-[11px] uppercase tracking-widest mb-2">
            <Search size={14} /> {t("dossier_observation")}
          </div>
          <p className="font-body text-void/90 leading-relaxed bg-void/5 border-l-2 border-void/30 pl-3 py-2">
            {enigma}
          </p>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-ember font-rune text-[11px] uppercase tracking-widest mb-2">
            <Target size={14} /> {t("dossier_objective")}
          </div>
          <p className="font-body text-void/90 leading-relaxed bg-void/5 border-l-2 border-ember/40 pl-3 py-2">
            {mission}
          </p>
        </div>

        {!showHint ? (
          <button
            type="button"
            onClick={revealHint}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-void/40 text-void/60 text-xs uppercase tracking-widest font-rune py-2 hover:border-void/70 hover:text-void transition-colors"
          >
            <Eye size={14} />
            {t("oc_hint_show")}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-void text-parchment rounded-sm p-3 text-sm"
          >
            <p className="font-rune text-[9px] tracking-widest text-ember-bright/80 mb-1">{t("dossier_classified")}</p>
            <div className="flex items-start gap-2 font-body">
              <Eye size={14} className="shrink-0 mt-0.5" />
              {hint}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
