import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { Clock, AlertOctagon, BookMarked } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";
import { formatTime } from "@/lib/gameData";

// Équivalent de VictoryScreen.jsx pour l'archétype "notebook" : le carnet
// de terrain est complété plutôt qu'un badge de fin de quête fantastique.
// Même contrat de props (result, onReplay) que l'original.
export default function NotebookVictoryScreen({ result, onReplay }) {
  const { t } = useLanguage();

  useEffect(() => {
    confetti({ particleCount: 50, spread: 55, origin: { y: 0.5 }, colors: ["#C8A868", "#5A9A60", "#C4784C"] });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 18 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-parchment/95 text-void rounded-md border border-void-border/30 shadow-[0_16px_36px_rgba(0,0,0,0.4)] px-6 py-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-1.5 text-emerald font-rune text-[11px] tracking-widest mb-4"
        >
          <BookMarked size={16} /> {t("notebook_complete")}
        </motion.div>

        <h2 className="font-display text-2xl text-void mb-1">{t("victory_title")}</h2>
        <p className="text-void/50 mb-6 text-sm">{t("victory_subtitle")}</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox icon={<Clock size={16} />} label={t("victory_time")} value={formatTime(result.totalTime)} />
          <StatBox icon={<AlertOctagon size={16} />} label={t("victory_penalties")} value={result.penaltyCount} />
          <StatBox icon={<BookMarked size={16} />} label={t("victory_score")} value={result.score} highlight />
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
    <div className={`rounded-md border p-3 ${highlight ? "border-emerald/50 bg-emerald/10" : "border-void/20 bg-void/5"}`}>
      <div className={`flex items-center justify-center mb-1 ${highlight ? "text-emerald" : "text-void/50"}`}>{icon}</div>
      <div className="font-rune text-lg text-void">{value}</div>
      <div className="text-[10px] text-void/50 mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  );
}
