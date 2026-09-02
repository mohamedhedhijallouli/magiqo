import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Lightbulb, Eye } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Misc";

export default function ObjectCard({ gameObject, difficulty, stepNumber, totalSteps, onHintUsed }) {
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
      <Card className="overflow-hidden">
        <div
          className="h-28 flex items-center justify-center text-6xl relative"
          style={{ background: `linear-gradient(135deg, ${gameObject.color || "#8B7BF0"}33, transparent)` }}
        >
          <span className="drop-shadow-lg inline-block animate-bounce-soft">{gameObject.emoji || "✨"}</span>
          <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3">
            <Badge color="gold">
              {t("oc_step")} {stepNumber} {t("oc_of")} {totalSteps}
            </Badge>
          </div>
        </div>

        <CardContent>
          <h3 className="font-display text-2xl text-gold-bright text-center mb-5">{gameObject.displayName || gameObject.fantasy_name}</h3>

          <div className="mb-5">
            <div className="flex items-center gap-2 text-arcane font-bold text-sm mb-2">
              <Sparkles size={16} /> {t("oc_enigma")}
            </div>
            <p className="text-parchment/90 leading-relaxed bg-void/40 rounded-xl p-4 border border-void-border">
              {enigma}
            </p>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 text-ember-bright font-bold text-sm mb-2">
              <Zap size={16} /> {t("oc_mission")}
            </div>
            <p className="text-parchment/90 leading-relaxed bg-void/40 rounded-xl p-4 border border-void-border">
              {mission}
            </p>
          </div>

          {!showHint ? (
            <Button variant="ghost" size="sm" className="w-full" onClick={revealHint}>
              <Lightbulb size={16} />
              {t("oc_hint_show")}
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-start gap-2 bg-ember/10 border border-ember/30 rounded-xl p-3 text-sm text-ember-bright"
            >
              <Eye size={16} className="shrink-0 mt-0.5" />
              {hint}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
