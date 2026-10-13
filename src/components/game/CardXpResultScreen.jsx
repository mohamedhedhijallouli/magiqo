import React from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CardDisplay from "@/components/game/CardDisplay";
import { rarityForLevel } from "@/lib/cardProgression";

// Affiché à la fin du parcours (avant l'écran de victoire) quand un
// personnage a été choisi en début de partie — voir ChooseCardScreen.jsx.
// Montre les XP gagnés et la progression du niveau / de la rareté de la
// carte, avec une petite animation en cas de changement de palier.
export default function CardXpResultScreen({ card, previousLevel, newLevel, xpGained, onContinue }) {
  const { t } = useLanguage();
  const prevRarity = rarityForLevel(previousLevel);
  const newRarity = rarityForLevel(newLevel);
  const rarityChanged = prevRarity.slug !== newRarity.slug;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md mx-auto">
      <Card>
        <CardContent className="text-center">
          <div className="inline-flex items-center gap-1.5 text-gold font-rune text-xs tracking-widest border border-gold-dim/40 rounded-full px-3 py-1 mb-5">
            <Zap size={12} /> +{xpGained} XP
          </div>

          <div className="flex items-center justify-center gap-4 mb-5">
            <CardDisplay card={card} level={previousLevel} size="sm" />
            <ArrowRight className="text-gold-dim shrink-0" size={20} />
            <CardDisplay card={card} level={newLevel} size="sm" />
          </div>

          <p className="font-display text-lg text-gold-bright mb-1">{t("cxr_new_level")} {newLevel}</p>
          {rarityChanged ? (
            <motion.p
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="text-sm font-semibold mb-6"
              style={{ color: "rgb(232 178 77)" }}
            >
              {t("cxr_rarity_up")} {newRarity.emoji} {newRarity.label} !
            </motion.p>
          ) : (
            <p className="text-sm text-muted mb-6">{newRarity.emoji} {newRarity.label}</p>
          )}

          <Button className="w-full" onClick={onContinue}>
            {t("reveal_continue")}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
