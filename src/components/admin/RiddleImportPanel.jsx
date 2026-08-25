import React, { useState, useEffect, useMemo } from "react";
import { Search, Download, CheckCircle2, Globe2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { Badge, useConfirm, useToast } from "@/components/ui/Misc";
import { LANGUAGES } from "@/lib/i18n";
import { useLanguage } from "@/lib/LanguageContext";
import { taxonomyLabel } from "@/lib/utils";
import { LEVELS } from "@/lib/gameData";
import { Riddles, getAdminActiveLicenseCode } from "@/lib/db";
import { getActiveLicense } from "@/lib/auth";

const PAGE_SIZE = 60;

// Panneau d'import en masse de devinettes prêtes à l'emploi — §3 du cahier
// des charges : "toutes les langues, tous les types, toutes les tranches
// d'âge et toutes les difficultés". Suit le même schéma que
// CatalogImportPanel (objets/animaux) : un fichier /data/riddles-<lang>.json
// par langue, avec dé-duplication par `catalog_key` + langue.
export default function RiddleImportPanel({ open, onClose, existingRiddles, riddleTypes }) {
  const { t, lang: uiLang } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();

  const licenseLangCodes = (getActiveLicense()?.languages || ["FR"]).map((l) => l.toLowerCase());
  const defaultLang = licenseLangCodes.includes(uiLang) ? uiLang : licenseLangCodes[0] || "fr";

  const [catalogLang, setCatalogLang] = useState(defaultLang);
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (open) setCatalogLang(defaultLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultLang]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setDataset([]);
    setSelected(new Set());
    setVisibleCount(PAGE_SIZE);
    setTypeFilter("");
    setAgeFilter("");
    setDifficultyFilter("");
    setSearch("");
    fetch(`/data/riddles-${catalogLang}.json`)
      .then((r) => (r.ok ? r.json() : fetch(`/data/riddles-en.json`).then((r2) => r2.json())))
      .then((data) => setDataset(data))
      .finally(() => setLoading(false));
  }, [open, catalogLang]);

  // Une devinette du catalogue est "déjà importée" si une devinette portant
  // la même clé + langue existe déjà dans la collection.
  const importedKeys = useMemo(
    () => new Set(existingRiddles.filter((r) => r.catalog_key).map((r) => `${r.catalog_key}:${r.catalog_lang}`)),
    [existingRiddles]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dataset.filter((d) => {
      const matchesQ = !q || d.question.toLowerCase().includes(q) || d.answer.toLowerCase().includes(q);
      const matchesType = !typeFilter || d.riddle_type === typeFilter;
      const matchesAge = !ageFilter || d.age_group === ageFilter;
      const matchesDifficulty = !difficultyFilter || d.difficulty === difficultyFilter;
      return matchesQ && matchesType && matchesAge && matchesDifficulty;
    });
  }, [dataset, search, typeFilter, ageFilter, difficultyFilter]);

  const visible = filtered.slice(0, visibleCount);

  function toggle(key) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function importItems(items) {
    setImporting(true);
    try {
      const created = items.map((d) => ({
        question: d.question,
        type: d.type === "choice" ? "choice" : "text",
        answer: d.answer,
        choices: d.choices || [],
        alt_answers: d.alt_answers || [],
        hint: d.hint || "",
        difficulty: d.difficulty || "",
        riddle_type: d.riddle_type,
        age_group: d.age_group,
        language: catalogLang.toUpperCase(),
        is_active: true,
        catalog_key: d.key,
        catalog_lang: catalogLang,
        license_code: getAdminActiveLicenseCode(),
      }));
      await Riddles.bulkCreate(created);
      toast(`${created.length} ${t("cat_import_done")}`);
      setSelected(new Set());
      onClose(true);
    } finally {
      setImporting(false);
    }
  }

  async function handleImportSelection() {
    const items = dataset.filter((d) => selected.has(d.key) && !importedKeys.has(`${d.key}:${catalogLang}`));
    if (items.length === 0) return;
    await importItems(items);
  }

  async function handleImportAll() {
    const ok = await confirm({ title: t("rim_import_all"), message: `${filtered.length} ${t("cat_import_done")}. ${t("common_confirm")} ?` });
    if (!ok) return;
    const items = filtered.filter((d) => !importedKeys.has(`${d.key}:${catalogLang}`));
    await importItems(items);
  }

  return (
    <Modal open={open} onClose={() => onClose(false)} title={t("rim_title")} maxWidth="max-w-2xl">
      <p className="text-sm text-muted mb-4">{t("rim_intro")}</p>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-muted uppercase tracking-wide">
          <Globe2 size={13} /> {t("cat_import_language")}
        </div>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => {
            const allowed = licenseLangCodes.includes(l.code.toLowerCase());
            return (
              <button
                key={l.code}
                disabled={!allowed}
                title={!allowed ? t("cat_import_language_locked") : undefined}
                onClick={() => allowed && setCatalogLang(l.code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm transition-colors ${
                  !allowed
                    ? "opacity-35 cursor-not-allowed border-void-border text-muted"
                    : catalogLang === l.code
                    ? "bg-gold/15 border-gold-dim text-gold-bright"
                    : "bg-void/40 border-void-border text-muted hover:border-white/25"
                }`}
              >
                <span>{l.flag}</span> {l.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input className="pl-9 rtl:pl-4 rtl:pr-9" placeholder={t("common_search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-2 mb-4">
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">{t("pe_riddles_type_all")}</option>
          {riddleTypes.map((rt) => (
            <option key={rt.slug} value={rt.slug}>{rt.emoji} {taxonomyLabel(rt, t)}</option>
          ))}
        </Select>
        <Select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)}>
          <option value="">{t("rm_filter_age_all")}</option>
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>{l.emoji} {t(l.labelKey)}</option>
          ))}
        </Select>
        <Select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
          <option value="">{t("rim_difficulty_all")}</option>
          <option value="easy">{t("rm_difficulty_easy")}</option>
          <option value="medium">{t("rm_difficulty_medium")}</option>
          <option value="hard">{t("rm_difficulty_hard")}</option>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted text-sm py-8 text-center">{t("common_loading")}</p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto mb-4 pr-1">
            {visible.map((d) => {
              const already = importedKeys.has(`${d.key}:${catalogLang}`);
              const isSelected = selected.has(d.key);
              const typeInfo = riddleTypes.find((rt) => rt.slug === d.riddle_type);
              const level = LEVELS.find((l) => l.value === d.age_group);
              return (
                <button
                  key={d.key}
                  disabled={already}
                  onClick={() => toggle(d.key)}
                  className={`flex items-center gap-3 text-left px-3 py-2 rounded-xl border transition-colors ${
                    already
                      ? "border-void-border opacity-40 cursor-not-allowed"
                      : isSelected
                      ? "border-gold-dim bg-gold/10"
                      : "border-void-border hover:border-white/20 bg-void/30"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${isSelected ? "bg-gold border-gold" : "border-void-border"}`}>
                    {isSelected && <CheckCircle2 size={12} className="text-void" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-parchment truncate">{d.question}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {typeInfo && <Badge color="arcane">{typeInfo.emoji} {taxonomyLabel(typeInfo, t)}</Badge>}
                      {level && <Badge color={level.color}>{level.emoji}</Badge>}
                      {d.difficulty && <Badge color="muted">{t(`rm_difficulty_${d.difficulty}`)}</Badge>}
                    </div>
                  </div>
                  {already && <Badge color="muted">{t("unesco_already")}</Badge>}
                </button>
              );
            })}
            {visible.length === 0 && <p className="text-muted text-sm py-6 text-center">{t("rm_empty")}</p>}
          </div>
          {visibleCount < filtered.length && (
            <button onClick={() => setVisibleCount((v) => v + PAGE_SIZE)} className="text-arcane text-sm mb-4 hover:underline">
              + {filtered.length - visibleCount}
            </button>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-muted">{selected.size} {t("unesco_selected")} · {filtered.length} / {dataset.length}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleImportAll} disabled={importing || filtered.length === 0}>
                <Download size={14} /> {t("cat_import_all")}
              </Button>
              <Button size="sm" onClick={handleImportSelection} disabled={selected.size === 0 || importing}>
                <Download size={14} /> {t("unesco_import")}
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
