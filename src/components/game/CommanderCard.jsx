import React from "react";
import { motion } from "framer-motion";
import { Star, Swords, Shield, Coins, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";
import { getFamilyTheme, getRarity } from "@/lib/commanderCardThemes";

const BONUS_ICONS = { swords: Swords, shield: Shield, coins: Coins, sparkles: Sparkles };

// Carte "Commandant" — portrait, niveau dynamique, compétences, citation,
// historique et bonus, dans le style des cartes de personnages fournies en
// référence (Amilcar Barca, gladiateurs, personnages chinois...).
//
// Contrairement à ObjectCard/RevealCard, cette carte n'hérite PAS des
// couleurs du World du parcours en cours : sa palette vient de
// `riddle.card_family` (voir lib/commanderCardThemes.js) et reste donc
// identique où que ce personnage soit utilisé — c'est un choix délibéré
// (voir la discussion "carte liée au personnage, pas au parcours").
//
// `level` est calculé par l'appelant (Play.jsx) à partir de la performance
// du joueur sur CETTE devinette (voir computeCardLevel) — pas stocké sur la
// fiche du personnage, qui elle ne porte que des attributs fixes (nom,
// titre, famille, rareté, compétences, bonus, historique).
export default function CommanderCard({ riddle, level, status, onContinue }) {
  const { t } = useLanguage();
  const theme = getFamilyTheme(riddle.card_family);
  const rarity = getRarity(riddle.card_rarity);
  const skills = (riddle.card_skills || []).slice(0, 4);
  const bonuses = (riddle.card_bonuses || []).slice(0, 3);

  const vars = {
    "--cc-bg": theme.bg,
    "--cc-panel": theme.panel,
    "--cc-border": theme.border,
    "--cc-gold": theme.gold,
    "--cc-gold-bright": theme.goldBright,
    "--cc-accent": theme.accent,
    "--cc-parchment": theme.parchment,
    "--cc-font-display": theme.fontDisplay,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateY: -8 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ type: "spring", damping: 16 }}
      style={vars}
      className="w-full max-w-md mx-auto"
    >
      <div
        className="rounded-2xl overflow-hidden border-2 shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
        style={{ background: "rgb(var(--cc-bg))", borderColor: "rgb(var(--cc-gold) / 0.5)" }}
      >
        {/* Portrait */}
        <div className="relative h-56" style={{ background: "rgb(var(--cc-panel))" }}>
          {status && (
            <div
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide z-10"
              style={{
                background: status === "new" ? "rgb(var(--cc-accent))" : "rgb(var(--cc-gold))",
                color: "rgb(var(--cc-bg))",
              }}
            >
              {status === "new" && t("cc_status_new")}
              {status === "level_up" && t("cc_status_level_up")}
            </div>
          )}
          {riddle.image_url ? (
            <img src={riddle.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">{theme.emoji}</div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20" style={{ background: "linear-gradient(to top, rgb(var(--cc-bg)), transparent)" }} />

          {/* Niveau + rareté */}
          <div
            className="absolute top-3 right-3 flex flex-col items-center px-3 py-2 rounded-xl border"
            style={{ background: "rgb(var(--cc-bg) / 0.85)", borderColor: "rgb(var(--cc-gold) / 0.5)" }}
          >
            <span className="text-[9px] uppercase tracking-widest font-rune" style={{ color: "rgb(var(--cc-gold))" }}>
              {t("cc_level")}
            </span>
            <span className="text-2xl font-bold leading-none" style={{ color: "rgb(var(--cc-gold-bright))", fontFamily: "var(--cc-font-display)" }}>
              {level}
            </span>
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: rarity.stars }).map((_, i) => (
                <Star key={i} size={9} fill="rgb(var(--cc-gold))" style={{ color: "rgb(var(--cc-gold))" }} />
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pt-4 pb-5">
          <h3 className="text-xl font-bold" style={{ color: "rgb(var(--cc-gold-bright))", fontFamily: "var(--cc-font-display)" }}>
            {riddle.card_name}
          </h3>
          {riddle.card_title && (
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "rgb(var(--cc-gold) / 0.8)" }}>
              {riddle.card_title}
            </p>
          )}
          {riddle.card_quote && (
            <p className="text-xs italic mb-4" style={{ color: "rgb(var(--cc-parchment) / 0.7)" }}>
              "{riddle.card_quote}"
            </p>
          )}

          {skills.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest font-rune mb-2" style={{ color: "rgb(var(--cc-gold) / 0.7)" }}>
                {t("cc_skills")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {skills.map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-base leading-none mt-0.5">{s.icon || "✦"}</span>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "rgb(var(--cc-parchment))" }}>{s.name}</p>
                      {s.description && <p className="text-[10px] leading-snug" style={{ color: "rgb(var(--cc-parchment) / 0.6)" }}>{s.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {riddle.card_lore && (
            <div
              className="mb-4 p-3 rounded-lg border text-[11px] leading-relaxed"
              style={{ borderColor: "rgb(var(--cc-gold) / 0.25)", color: "rgb(var(--cc-parchment) / 0.75)" }}
            >
              {riddle.card_lore}
            </div>
          )}

          {bonuses.length > 0 && (
            <div
              className="mb-5 p-3 rounded-lg border"
              style={{ borderColor: "rgb(var(--cc-accent) / 0.4)", background: "rgb(var(--cc-accent) / 0.08)" }}
            >
              <p className="text-[10px] uppercase tracking-widest font-rune mb-2" style={{ color: "rgb(var(--cc-gold))" }}>
                {t("cc_bonuses")}
              </p>
              <div className="flex flex-col gap-1.5">
                {bonuses.map((b, i) => {
                  const Icon = BONUS_ICONS[b.icon] || Sparkles;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "rgb(var(--cc-parchment) / 0.9)" }}>
                      <Icon size={13} style={{ color: "rgb(var(--cc-gold))" }} />
                      {b.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button className="w-full" onClick={onContinue}>
            {t("reveal_continue")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
