import React, { useState, useEffect, useMemo } from "react";
import { Search, Download, CheckCircle2, Globe2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { Badge, useConfirm, useToast } from "@/components/ui/Misc";
import { LANGUAGES } from "@/lib/i18n";
import { useLanguage } from "@/lib/LanguageContext";
import { GameObjects, Animals, generateObjectId, getAdminActiveLicenseCode } from "@/lib/db";
import { getActiveLicense } from "@/lib/auth";

const PAGE_SIZE = 60;

// Panneau générique d'import de catalogue par langue, réutilisé pour les
// Objets et les Animaux : l'admin choisit UNE langue (indépendamment de la
// langue courante de l'interface — utile pour une licence multi-langues où
// chaque tuteur travaille dans une langue différente) et importe tout ou
// partie du catalogue prêt à l'emploi dans cette langue. Seules les langues
// couvertes par la licence active sont sélectionnables — les autres restent
// visibles mais grisées, pour rappeler qu'elles ne sont pas incluses.
export default function CatalogImportPanel({ open, onClose, kind, existingItems, existingIds, typeOptions }) {
  const { t, lang: uiLang } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const isAnimals = kind === "animal";
  const collection = isAnimals ? Animals : GameObjects;
  const filePrefix = isAnimals ? "animals" : "objects";

  const licenseLangCodes = (getActiveLicense()?.languages || ["FR"]).map((l) => l.toLowerCase());
  const defaultLang = licenseLangCodes.includes(uiLang) ? uiLang : licenseLangCodes[0] || "fr";

  const [catalogLang, setCatalogLang] = useState(defaultLang);
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
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
    fetch(`/data/${filePrefix}-${catalogLang}.json`)
      .then((r) => (r.ok ? r.json() : fetch(`/data/${filePrefix}-en.json`).then((r2) => r2.json())))
      .then((data) => setDataset(data))
      .finally(() => setLoading(false));
  }, [open, catalogLang, filePrefix]);

  // Un item du catalogue est considéré "déjà importé" si un objet/animal du
  // même `catalog_key` (+ langue) existe déjà dans le jeu.
  const importedKeys = useMemo(
    () => new Set(existingItems.filter((it) => it.catalog_key).map((it) => `${it.catalog_key}:${it.catalog_lang}`)),
    [existingItems]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dataset.filter((d) => {
      const matchesQ = !q || d.real_name.toLowerCase().includes(q);
      const matchesType = !typeFilter || d.category_or_type === typeFilter;
      return matchesQ && matchesType;
    });
  }, [dataset, search, typeFilter]);

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
      const idsInUse = new Set(existingIds);
      const created = [];
      for (const it of items) {
        const id = generateObjectId([...idsInUse]);
        idsInUse.add(id);
        const base = {
          real_name: it.real_name,
          fantasy_name: it.fantasy_name,
          emoji: it.emoji,
          description: it.description,
          enigma_explorateur: it.enigma_explorateur, enigma_apprenti: it.enigma_apprenti,
          enigma_aventurier: it.enigma_aventurier, enigma_expert: it.enigma_expert,
          hint_explorateur: it.hint_explorateur, hint_apprenti: it.hint_apprenti,
          hint_aventurier: it.hint_aventurier, hint_expert: it.hint_expert,
          mission_explorateur: it.mission_explorateur, mission_apprenti: it.mission_apprenti,
          mission_aventurier: it.mission_aventurier, mission_expert: it.mission_expert,
          image_url: "", is_active: true, language: catalogLang.toUpperCase(),
          catalog_key: it.key, catalog_lang: catalogLang, license_code: getAdminActiveLicenseCode(),
        };
        created.push(
          isAnimals
            ? { ...base, type: it.category_or_type, code: id }
            : { ...base, category: it.category_or_type, color: "#8B7BF0", object_id: id }
        );
      }
      await collection.bulkCreate(created);
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
    const ok = await confirm({ title: t("cat_import_all"), message: `${filtered.length} ${t("cat_import_done")}. ${t("common_confirm")} ?` });
    if (!ok) return;
    const items = filtered.filter((d) => !importedKeys.has(`${d.key}:${catalogLang}`));
    await importItems(items);
  }

  const title = isAnimals ? t("cat_import_title_animals") : t("cat_import_title_objects");

  return (
    <Modal open={open} onClose={() => onClose(false)} title={title} maxWidth="max-w-2xl">
      <p className="text-sm text-muted mb-4">{t("cat_import_intro")}</p>

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

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input className="pl-9 rtl:pl-4 rtl:pr-9" placeholder={t("common_search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {typeOptions && typeOptions.length > 0 && (
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="sm:w-56">
            <option value="">{t("om_category_all")}</option>
            {typeOptions.map((c) => (
              <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>
            ))}
          </Select>
        )}
      </div>

      {loading ? (
        <p className="text-muted text-sm py-8 text-center">{t("common_loading")}</p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto mb-4 pr-1">
            {visible.map((d) => {
              const already = importedKeys.has(`${d.key}:${catalogLang}`);
              const isSelected = selected.has(d.key);
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
                  <span className="text-xl shrink-0">{d.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-parchment truncate">{d.fantasy_name}</p>
                    <p className="text-xs text-muted truncate">{d.real_name}</p>
                  </div>
                  {already && <Badge color="muted">{t("unesco_already")}</Badge>}
                </button>
              );
            })}
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
