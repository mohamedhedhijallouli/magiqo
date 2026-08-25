import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { Clock, AlertOctagon, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";
import { formatTime } from "@/lib/gameData";

// Équivalent de VictoryScreen.jsx pour l'archétype "map" : un coffre au
// trésor ouvert plutôt qu'un badge de fin de quête fantastique. Même
// contrat de props (result, onReplay) que l'original.
export default function MapVictoryScreen({ result, onReplay }) {
  const { t } = useLanguage();

  useEffect(() => {
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 }, colors: ["#D4B060", "#4E946C", "#B45C30"] });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 16 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-void-panel/90 border-2 border-dashed border-gold-dim/50 rounded-2xl px-6 py-8 text-center shadow-glow">
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-6xl mb-3"
        >
          🏆
        </motion.div>

        <div className="inline-flex items-center gap-1.5 text-gold font-rune text-[11px] tracking-widest border border-gold-dim/40 rounded-full px-3 py-1 mb-4">
          <Sparkles size={12} /> {t("map_treasure_found")}
        </div>

        <h2 className="font-display text-2xl text-gold-bright mb-1">{t("victory_title")}</h2>
        <p className="text-muted mb-6 text-sm">{t("victory_subtitle")}</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox icon={<Clock size={16} />} label={t("victory_time")} value={formatTime(result.totalTime)} />
          <StatBox icon={<AlertOctagon size={16} />} label={t("victory_penalties")} value={result.penaltyCount} />
          <StatBox icon={<Sparkles size={16} />} label={t("victory_score")} value={result.score} highlight />
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
    <div className={`rounded-xl border p-3 ${highlight ? "border-gold-dim/60 bg-gold/10" : "border-void-border bg-void/40"}`}>
      <div className={`flex items-center justify-center mb-1 ${highlight ? "text-gold" : "text-muted"}`}>{icon}</div>
      <div className="font-rune text-lg text-parchment">{value}</div>
      <div className="text-[10px] text-muted mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  );
}
