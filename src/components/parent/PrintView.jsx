import React, { useRef, useState } from "react";
import { X, Download, BookOpen } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";
import { LEVELS } from "@/lib/gameData";
import { WorldThemeProvider } from "@/lib/WorldThemeContext";

export default function PrintView({ parcours, objects = [], animals = [], places = [], riddles = [], onClose }) {
  const { t } = useLanguage();
  const ref = useRef(null);
  const rulesRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [generatingRules, setGeneratingRules] = useState(false);

  // V22 : en mode "Jeu de cartes", les cartes imprimées n'affichent ni code,
  // ni énigme, ni indice, ni devinette — seulement le nom et l'image — et
  // des cartes supplémentaires reprennent les règles (pénalités/suspension)
  // pour être physiquement posées sur la table de jeu.
  const isCardGame = parcours.mode === "card_game";

  const pool = [...objects, ...animals, ...places];
  const cards = parcours.object_ids
    .map((id) => pool.find((o) => o.id === id))
    .filter(Boolean)
    .map((o) => ({
      ...o,
      displayName: o.fantasy_name || o.magic_name || o.gaming_name || o.real_name,
      entryCode: o.object_id || o.code,
    }));

  // Cartes "Devinette" — question uniquement (jamais la réponse), pour que
  // le Maître du Jeu puisse préparer/lire les devinettes sans dévoiler la
  // solution aux joueurs à l'avance. Comme les cartes de règles, elles ne
  // sont imprimées qu'en mode "Jeu de cartes" (partie hors application) :
  // en Intérieur/Extérieur, la devinette s'affiche directement dans
  // l'application pendant la partie — une carte papier n'aurait aucun
  // usage et ne ferait que dévoiler la question à l'avance.
  const riddleCards = isCardGame
    ? (parcours.riddle_ids || []).map((id) => riddles.find((r) => r.id === id)).filter(Boolean)
    : [];

  const ruleCards = isCardGame
    ? [
        { labelKey: "print_rule_wrong_code", value: `${parcours.penalty_per_wrong_code_seconds || 0}s`, icon: "🔑" },
        { labelKey: "print_rule_hint", value: `${parcours.penalty_per_hint_seconds || 0}s`, icon: "💡" },
        { labelKey: "print_rule_wrong_riddle", value: `${parcours.penalty_per_wrong_riddle_seconds || 0}s`, icon: "❓" },
        {
          labelKey: "print_rule_suspension",
          value: parcours.suspension_after_errors > 0
            ? `${parcours.suspension_after_errors} → ${parcours.suspension_duration_seconds || 0}s`
            : t("print_rule_suspension_off"),
          icon: "⏸️",
        },
      ]
    : [];

  async function downloadPdf() {
    setGenerating(true);
    try {
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const nodes = ref.current.querySelectorAll(".print-card");
      const perPage = 4;
      for (let i = 0; i < nodes.length; i++) {
        const canvas = await html2canvas(nodes[i], { scale: 2, backgroundColor: "#181233" });
        const img = canvas.toDataURL("image/png");
        const col = i % 2;
        const row = Math.floor((i % perPage) / 2);
        if (i > 0 && i % perPage === 0) pdf.addPage();
        const w = 90, h = 110;
        const x = 10 + col * 95;
        const y = 10 + row * 115;
        pdf.addImage(img, "PNG", x, y, w, h);
      }
      pdf.save(`${(parcours.magic_name || parcours.name).replace(/\s+/g, "_")}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  // Document séparé, imprimable indépendamment : les règles générales du
  // jeu, avec un rappel explicite que chaque tranche d'âge a ses propres
  // énigmes et devinettes.
  async function downloadRulesPdf() {
    setGeneratingRules(true);
    try {
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const canvas = await html2canvas(rulesRef.current, { scale: 2, backgroundColor: "#181233" });
      const img = canvas.toDataURL("image/png");
      const pageWidth = 210;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, pageWidth, imgHeight);
      pdf.save(`regles_du_jeu_${(parcours.magic_name || parcours.name).replace(/\s+/g, "_")}.pdf`);
    } finally {
      setGeneratingRules(false);
    }
  }

  return (
    <WorldThemeProvider worldSlug={parcours.world}>
    <div className="fixed inset-0 z-50 bg-void/95 backdrop-blur-sm overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-void-panel border-b border-void-border flex-wrap gap-2">
        <h3 className="font-display text-lg text-gold-bright">{t("print_title")} — {parcours.magic_name || parcours.name}</h3>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={downloadPdf} disabled={generating}>
            <Download size={15} /> {generating ? t("common_loading") : t("print_cards_btn")}
          </Button>
          <Button size="sm" variant="ghost" onClick={downloadRulesPdf} disabled={generatingRules}>
            <BookOpen size={15} /> {generatingRules ? t("common_loading") : t("print_rules_btn")}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      </div>

      <div ref={ref} className="max-w-5xl mx-auto p-8 grid sm:grid-cols-2 gap-6">
        {cards.map((o, i) => (
          <div
            key={o.id}
            className="print-card relative rounded-2xl border-2 p-6 flex flex-col items-center text-center gap-3 bg-void-panel"
            style={{ borderColor: o.color || "#E8B24D", width: 340, height: 420 }}
          >
            <span className="font-rune text-xs text-muted absolute top-4 left-4">#{i + 1}</span>
            <div className="text-6xl mt-4">{o.image_url ? <img src={o.image_url} className="w-24 h-24 object-cover rounded-xl" /> : o.emoji}</div>
            <h4 className="font-display text-xl text-gold-bright">{o.displayName}</h4>
            {!isCardGame && <p className="text-xs text-muted">{o.real_name}</p>}
            {!isCardGame && (
              <div className="mt-auto w-full">
                <p className="text-[10px] uppercase tracking-widest text-muted mb-1">{t("print_scan_hint")}</p>
                <div className="font-rune text-3xl tracking-[0.3em] text-gold-bright border-2 border-dashed border-gold-dim/50 rounded-xl py-3">
                  {o.entryCode}
                </div>
              </div>
            )}
          </div>
        ))}

        {riddleCards.map((r, i) => (
          <div
            key={r.id}
            className="print-card relative rounded-2xl border-2 border-emerald/60 p-6 flex flex-col items-center text-center gap-3 bg-void-panel justify-center"
            style={{ width: 340, height: 420 }}
          >
            <span className="font-rune text-xs text-muted absolute top-4 left-4">❓{i + 1}</span>
            <div className="text-5xl">❓</div>
            <h4 className="font-display text-lg text-emerald-bright">{t("print_riddle_card_title")}</h4>
            <p className="text-sm text-parchment/90 leading-relaxed">{r.question}</p>
          </div>
        ))}

        {ruleCards.map((r) => (
          <div
            key={r.labelKey}
            className="print-card relative rounded-2xl border-2 border-arcane/60 p-6 flex flex-col items-center text-center gap-3 bg-void-panel justify-center"
            style={{ width: 340, height: 420 }}
          >
            <div className="text-6xl">{r.icon}</div>
            <h4 className="font-display text-lg text-arcane">{t(r.labelKey)}</h4>
            <p className="font-rune text-3xl text-gold-bright">{r.value}</p>
          </div>
        ))}
      </div>

      {/* Zone hors-écran utilisée pour générer le PDF des règles */}
      <div className="fixed -left-[9999px] top-0">
        <div ref={rulesRef} className="w-[780px] p-10 bg-void-panel text-parchment">
          <h2 className="font-display text-2xl text-gold-bright mb-1">{t("print_rules_title")}</h2>
          <p className="text-sm text-muted mb-6">{parcours.magic_name || parcours.name}</p>

          <h3 className="font-display text-lg text-gold-bright mb-2">{t("print_rules_how_title")}</h3>
          <p className="text-sm mb-5 leading-relaxed">{t("print_rules_how_text")}</p>

          <h3 className="font-display text-lg text-gold-bright mb-2">{t("print_rules_penalties_title")}</h3>
          <ul className="text-sm mb-5 space-y-1.5">
            <li>🔑 {t("print_rule_wrong_code")}: {parcours.penalty_per_wrong_code_seconds || 0}s</li>
            <li>💡 {t("print_rule_hint")}: {parcours.penalty_per_hint_seconds || 0}s</li>
            <li>❓ {t("print_rule_wrong_riddle")}: {parcours.penalty_per_wrong_riddle_seconds || 0}s</li>
            <li>⏸️ {t("print_rule_suspension")}: {parcours.suspension_after_errors > 0 ? `${parcours.suspension_after_errors} → ${parcours.suspension_duration_seconds || 0}s` : t("print_rule_suspension_off")}</li>
          </ul>

          <div className="mt-6 p-4 rounded-xl border border-gold-dim/40 bg-gold/5">
            <p className="text-sm font-semibold text-gold-bright mb-1">{t("print_rules_age_title")}</p>
            <p className="text-xs leading-relaxed">{t("print_rules_age_text")}</p>
            <ul className="text-xs mt-2 space-y-0.5">
              {LEVELS.map((l) => (
                <li key={l.value}>{l.emoji} {t(l.labelKey)} · {t(l.ageRangeKey)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
    </WorldThemeProvider>
  );
}
