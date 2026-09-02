import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Compass, Navigation, Eye } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

// Équivalent de ObjectCard.jsx pour l'archétype "map" (Carte au Trésor,
// Carte du Capitaine, Parchemin du Royaume, City Explorer) : la carte
// devient un repère épinglé sur la carte plutôt qu'une fiche d'enquête ou
// une carte fantastique. Même contrat de props que l'original.
export default function MapObjectCard({ gameObject, difficulty, stepNumber, totalSteps, onHintUsed }) {
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
      <div className="relative bg-void-panel/90 border-2 border-dashed border-gold-dim/50 rounded-2xl px-6 pt-9 pb-6 shadow-glow">
        {/* Épingle de repère */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-ember flex items-center justify-center border-2 border-void shadow-lg">
            <MapPin size={18} className="text-void" strokeWidth={2.5} />
          </div>
          <div className="w-0.5 h-2 bg-ember" />
        </div>

        <div className="flex items-center justify-between mb-5 mt-2">
          <span className="text-4xl">{gameObject.emoji || "📍"}</span>
          <div className="flex items-center gap-1.5 text-gold-dim font-rune text-[11px] tracking-widest border border-gold-dim/40 rounded-full px-3 py-1">
            <Compass size={12} /> {t("map_waypoint")} {stepNumber}/{totalSteps}
          </div>
        </div>

        <h3 className="font-display text-xl text-gold-bright text-center mb-5">
          {gameObject.displayName || gameObject.fantasy_name}
        </h3>

        <div className="mb-4">
          <div className="flex items-center gap-2 text-arcane font-rune text-[11px] uppercase tracking-widest mb-2">
            <MapPin size={14} /> {t("map_landmark")}
          </div>
          <p className="text-parchment/90 leading-relaxed border-l-2 border-arcane/40 pl-3 py-1">{enigma}</p>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-ember-bright font-rune text-[11px] uppercase tracking-widest mb-2">
            <Navigation size={14} /> {t("map_heading")}
          </div>
          <p className="text-parchment/90 leading-relaxed border-l-2 border-ember/40 pl-3 py-1">{mission}</p>
        </div>

        {!showHint ? (
          <button
            type="button"
            onClick={revealHint}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-gold-dim/50 text-gold-dim text-xs uppercase tracking-widest font-rune py-2 rounded-full hover:border-gold-dim hover:text-gold transition-colors"
          >
            <Eye size={14} />
            {t("oc_hint_show")}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={cn("bg-void/60 border border-gold-dim/40 rounded-xl p-3 text-sm text-parchment")}
          >
            <p className="font-rune text-[9px] tracking-widest text-gold-dim mb-1">{t("map_scout_note")}</p>
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
