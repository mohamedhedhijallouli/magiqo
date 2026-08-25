import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { Clock, AlertOctagon, Rocket } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";
import { formatTime } from "@/lib/gameData";

// Équivalent de VictoryScreen.jsx pour l'archétype "dashboard" : un retour
// de mission spatiale réussie plutôt qu'un badge fantastique. Même contrat
// de props (result, onReplay) que l'original.
export default function DashboardVictoryScreen({ result, onReplay }) {
  const { t } = useLanguage();

  useEffect(() => {
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 }, colors: ["#78D2EC", "#8C6CF0", "#50DCB0"] });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 16 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-void-panel/90 border border-arcane/40 rounded-lg px-6 py-8 text-center">
        <motion.div
          initial={{ scale: 0, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-6xl mb-3"
        >
          🚀
        </motion.div>

        <div className="inline-flex items-center gap-1.5 text-arcane font-rune text-[11px] tracking-widest border border-arcane/40 rounded px-3 py-1 mb-4">
          <Rocket size={12} /> {t("dashboard_mission_complete")}
        </div>

        <h2 className="font-display text-2xl text-gold-bright mb-1">{t("victory_title")}</h2>
        <p className="text-muted mb-6 text-sm">{t("victory_subtitle")}</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox icon={<Clock size={16} />} label={t("victory_time")} value={formatTime(result.totalTime)} />
          <StatBox icon={<AlertOctagon size={16} />} label={t("victory_penalties")} value={result.penaltyCount} />
          <StatBox icon={<Rocket size={16} />} label={t("victory_score")} value={result.score} highlight />
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
    <div className={`rounded border p-3 ${highlight ? "border-arcane/60 bg-arcane/10" : "border-void-border bg-void/40"}`}>
      <div className={`flex items-center justify-center mb-1 ${highlight ? "text-arcane" : "text-muted"}`}>{icon}</div>
      <div className="font-rune text-lg text-parchment">{value}</div>
      <div className="text-[10px] text-muted mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  );
}
