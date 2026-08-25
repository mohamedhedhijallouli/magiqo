import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { Clock, AlertOctagon, Trophy } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatTime, BADGE_THRESHOLDS } from "@/lib/gameData";

export default function VictoryScreen({ result, onReplay }) {
  const { t } = useLanguage();
  const badge = BADGE_THRESHOLDS[result.badge];

  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 65, origin: { x: 0 }, colors: ["#E8B24D", "#8B7BF0", "#3FB88A", "#E2673B"] });
      confetti({ particleCount: 4, angle: 120, spread: 65, origin: { x: 1 }, colors: ["#E8B24D", "#8B7BF0", "#3FB88A", "#E2673B"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 18 }}
      className="w-full max-w-md mx-auto"
    >
      <Card>
        <CardContent className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-7xl mb-3"
          >
            <motion.span
              className="inline-block"
              animate={{ rotate: [0, -8, 8, -6, 6, 0], scale: [1, 1.08, 1] }}
              transition={{ delay: 1, duration: 1.4, repeat: Infinity, repeatDelay: 2 }}
            >
              {badge.emoji}
            </motion.span>
          </motion.div>
          <h2 className="font-display text-3xl text-gradient-gold mb-1">{t("victory_title")}</h2>
          <p className="text-muted mb-6">{t("victory_subtitle")}</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatBox icon={<Clock size={18} />} label={t("victory_time")} value={formatTime(result.totalTime)} />
            <StatBox icon={<AlertOctagon size={18} />} label={t("victory_penalties")} value={result.penaltyCount} />
            <StatBox icon={<Trophy size={18} />} label={t("victory_score")} value={result.score} highlight />
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={onReplay}>{t("victory_new_quest")}</Button>
            <Button as={Link} to="/" variant="ghost">
              {t("victory_home")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatBox({ icon, label, value, highlight }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-gold-dim bg-gold/10" : "border-void-border bg-void/40"}`}>
      <div className={`flex items-center justify-center mb-1 ${highlight ? "text-gold-bright" : "text-arcane"}`}>{icon}</div>
      <div className={`font-rune text-lg ${highlight ? "text-gold-bright" : "text-parchment"}`}>{value}</div>
      <div className="text-[11px] text-muted mt-0.5">{label}</div>
    </div>
  );
}
