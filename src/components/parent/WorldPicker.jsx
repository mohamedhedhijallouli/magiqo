import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { WORLDS, getWorld, worldToCssVars } from "@/lib/worlds";
import { cn } from "@/lib/utils";

// Chips de filtre par archétype. La clé doit correspondre à
// world.interfaceArchetype (voir lib/worlds.js) ; le libellé est traduit.
const ARCHETYPE_FILTERS = [
  { key: "all", labelKey: "wp_filter_all" },
  { key: "book", labelKey: "wp_filter_book" },
  { key: "dossier", labelKey: "wp_filter_dossier" },
  { key: "map", labelKey: "wp_filter_map" },
  { key: "notebook", labelKey: "wp_filter_notebook" },
  { key: "arena", labelKey: "wp_filter_arena" },
  { key: "dashboard", labelKey: "wp_filter_dashboard" },
];

// Sélecteur de World pour le Créateur de Parcours : recherche + filtre par
// archétype + grille de vignettes (chacune montrant ses propres couleurs
// via un mini-dégradé, sans jamais toucher au thème global de la page) +
// panneau d'aperçu live qui rejoue une mini carte "objet" dans le thème du
// World sélectionné, pour que le parent voie réellement l'ambiance avant
// de valider — exactement l'esprit de la section "IDENTITÉ" du concept
// MagiQo Worlds.
export default function WorldPicker({ value, onChange }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [archetypeFilter, setArchetypeFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WORLDS.filter((w) => {
      if (archetypeFilter !== "all" && w.interfaceArchetype !== archetypeFilter) return false;
      if (!q) return true;
      const label = t(w.labelKey).toLowerCase();
      return label.includes(q) || w.slug.includes(q);
    });
  }, [query, archetypeFilter, t]);

  const selectedWorld = getWorld(value);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("wp_search_placeholder")}
            className="w-full bg-void/40 border border-void-border rounded-lg pl-8 pr-3 py-2 text-sm text-parchment placeholder:text-muted focus:outline-none focus:border-gold-dim/60"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {ARCHETYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setArchetypeFilter(f.key)}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded-full border transition-colors",
              archetypeFilter === f.key
                ? "bg-gold/15 border-gold-dim text-gold-bright"
                : "border-void-border text-muted hover:border-white/25"
            )}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4 max-h-64 overflow-y-auto pr-1">
        {filtered.map((w) => {
          const active = value === w.slug;
          const c = w.theme.colors;
          return (
            <button
              type="button"
              key={w.slug}
              onClick={() => onChange(w.slug)}
              className={cn(
                "relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs text-center transition-colors",
                active ? "bg-gold/15 border-gold-dim text-gold-bright" : "bg-void/40 border-void-border text-muted hover:border-white/25"
              )}
            >
              {/* Vignette de couleurs propre à ce World, indépendante du thème actif */}
              <span
                className="flex gap-0.5 rounded-full overflow-hidden w-8 h-2"
                title={t(w.labelKey)}
              >
                <span className="flex-1" style={{ background: `rgb(${c.gold})` }} />
                <span className="flex-1" style={{ background: `rgb(${c.ember})` }} />
                <span className="flex-1" style={{ background: `rgb(${c.arcane})` }} />
                <span className="flex-1" style={{ background: `rgb(${c.emerald})` }} />
              </span>
              <span className="text-xl">{w.emoji}</span>
              <span className="leading-tight">{t(w.labelKey)}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted text-sm py-6">{t("wp_no_results")}</p>
        )}
      </div>

      {/* Aperçu live : les variables CSS sont posées sur ce conteneur (et lui
          seul, pas <html>) — le reste de l'écran d'admin garde son thème,
          seul cet encart rejoue vraiment l'ambiance du World choisi. */}
      <div style={worldToCssVars(selectedWorld)} className="rounded-xl overflow-hidden border border-void-border">
        <div className="bg-void px-4 py-2 border-b border-void-border flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted font-rune">{t("wp_preview_title")}</span>
          <span className="text-[10px] text-gold-dim font-rune">{selectedWorld.emoji} {t(selectedWorld.labelKey)}</span>
        </div>
        <div className="bg-void-panel px-5 py-5">
          <p className="font-display text-lg text-gold-bright mb-2">{t(selectedWorld.labelKey)}</p>
          <p className="font-body text-sm text-parchment/80 mb-3">{t("wp_preview_sample_text")}</p>
          <div className="flex gap-2">
            <span className="text-[10px] font-rune uppercase tracking-widest text-arcane border border-arcane/40 rounded-full px-2.5 py-1">
              {t("wp_preview_badge_1")}
            </span>
            <span className="text-[10px] font-rune uppercase tracking-widest text-ember-bright border border-ember/40 rounded-full px-2.5 py-1">
              {t("wp_preview_badge_2")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
