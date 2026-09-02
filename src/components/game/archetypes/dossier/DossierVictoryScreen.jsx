import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { Clock, AlertOctagon, FileCheck2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";
import { formatTime } from "@/lib/gameData";

// Équivalent de VictoryScreen.jsx pour le World "Dossier Classifié" :
// l'écran de victoire devient une clôture d'affaire tamponnée "AFFAIRE
// RÉSOLUE" plutôt qu'un feu d'artifice de badge fantastique. Même contrat
// de props (result, onReplay) que l'original.
export default function DossierVictoryScreen({ result, onReplay }) {
  const { t } = useLanguage();

  useEffect(() => {
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.4 }, colors: ["#C4A45C", "#786C5C", "#A8365A"] });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, rotate: -1 }}
      animate={{ opacity: 1, scale: 1, rotate: -1 }}
      transition={{ type: "spring", damping: 18 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-parchment/95 text-void rounded-sm border border-void-border/40 shadow-[0_18px_40px_rgba(0,0,0,0.45)] px-6 py-8 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: -12 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-block border-4 border-ember/70 text-ember/80 font-rune text-sm tracking-widest px-4 py-2 rounded-sm mb-5"
        >
          {t("dossier_case_closed")}
        </motion.div>

        <h2 className="font-display text-2xl text-void mb-1">{t("victory_title")}</h2>
        <p className="text-void/50 mb-6 text-sm">{t("victory_subtitle")}</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox icon={<Clock size={16} />} label={t("victory_time")} value={formatTime(result.totalTime)} />
          <StatBox icon={<AlertOctagon size={16} />} label={t("victory_penalties")} value={result.penaltyCount} />
          <StatBox icon={<FileCheck2 size={16} />} label={t("victory_score")} value={result.score} highlight />
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={onReplay}>{t("victory_new_quest")}</Button>
          <Button as={Link} to="/" variant="ghost">
            {t("victory_home")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function StatBox({ icon, label, value, highlight }) {
  return (
    <div className={`rounded-sm border p-3 ${highlight ? "border-ember/50 bg-ember/5" : "border-void/20 bg-void/5"}`}>
      <div className={`flex items-center justify-center mb-1 ${highlight ? "text-ember" : "text-void/50"}`}>{icon}</div>
      <div className="font-rune text-lg text-void">{value}</div>
      <div className="text-[10px] text-void/50 mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  );
}
