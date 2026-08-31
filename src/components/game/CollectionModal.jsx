import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, KeyRound } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getPlayerCollection } from "@/lib/collection";
import { getFamilyTheme, getRarity } from "@/lib/commanderCardThemes";

// Galerie compacte des cartes obtenues par un joueur — accessible depuis
// l'écran de victoire (le player_id et le license_code sont déjà connus à
// ce moment de la session, pas besoin de redemander le code). Volontairement
// indépendante des 6 VictoryScreen par archétype : un seul point d'ajout
// dans Play.jsx plutôt que six.
export default function CollectionModal({ playerId, playerCode, licenseCode, onClose }) {
  const { t } = useLanguage();
  const [cards, setCards] = useState(null);

  useEffect(() => {
    getPlayerCollection({ playerId, licenseCode }).then(setCards);
  }, [playerId, licenseCode]);

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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cards.map((c) => {
                const theme = getFamilyTheme(c.card_family);
                const rarity = getRarity(c.card_rarity);
                return (
                  <div
                    key={c.id}
                    className="rounded-xl border p-3 text-center"
                    style={{ background: `rgb(${theme.panel})`, borderColor: `rgb(${theme.gold} / 0.4)` }}
                  >
                    <span className="text-3xl">{theme.emoji}</span>
                    <p className="text-xs font-semibold mt-1 truncate" style={{ color: `rgb(${theme.goldBright})` }}>{c.card_name}</p>
                    <p className="text-[10px]" style={{ color: `rgb(${theme.gold} / 0.7)` }}>{"⭐".repeat(rarity.stars)}</p>
                    <p className="text-lg font-bold mt-1" style={{ color: `rgb(${theme.goldBright})` }}>{c.level}</p>
                    {c.times_earned > 1 && (
                      <p className="text-[9px] text-muted mt-0.5">×{c.times_earned}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
