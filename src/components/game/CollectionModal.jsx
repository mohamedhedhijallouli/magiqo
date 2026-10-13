import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, KeyRound } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getPlayerCollection } from "@/lib/cardProgression";
import CardDisplay from "@/components/game/CardDisplay";

// Galerie des cartes obtenues par un joueur — accessible depuis l'écran de
// victoire (le player_id est déjà connu à ce moment de la session, pas
// besoin de redemander le code). Collection UNIVERSELLE (pas de
// cloisonnement par licence) — voir lib/cardProgression.js.
export default function CollectionModal({ playerId, playerCode, onClose }) {
  const { t } = useLanguage();
  const [cards, setCards] = useState(null);

  useEffect(() => {
    getPlayerCollection({ playerId }).then(setCards);
  }, [playerId]);

  return (
    <div className="fixed inset-0 z-50 bg-void/90 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-void-panel border border-void-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-void-border">
          <div>
            <h2 className="font-display text-lg text-gold-bright">{t("coll_title")}</h2>
            <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
              <KeyRound size={11} /> {t("coll_code_reminder")}: <span className="font-rune tracking-widest text-gold-dim">{playerCode}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-parchment"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto p-4">
          {cards === null ? (
            <p className="text-center text-muted text-sm py-10">{t("common_loading")}</p>
          ) : cards.length === 0 ? (
            <p className="text-center text-muted text-sm py-10">{t("coll_empty")}</p>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {cards.map((c) => (
                <CardDisplay key={c.id} card={{ name: c.card_name, illustration_url: c.card_illustration }} level={c.level} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
