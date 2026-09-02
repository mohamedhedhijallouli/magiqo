import React, { useState, useEffect, useMemo } from "react";
import { Search, Download, CheckCircle2, Globe2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { Badge, useConfirm, useToast } from "@/components/ui/Misc";
import { LANGUAGES } from "@/lib/i18n";
import { useLanguage } from "@/lib/LanguageContext";
import { Places, generatePlaceCode, getAdminActiveLicenseCode } from "@/lib/db";
import { getActiveLicense } from "@/lib/auth";
import { generatePlaceContent } from "@/lib/aiGenerator";

const PAGE_SIZE = 60;

export default function UnescoImportPanel({ open, onClose, existingPlaces, existingCodes }) {
  const { t, lang: uiLang } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const licenseLangCodes = (getActiveLicense()?.languages || ["FR"]).map((l) => l.toLowerCase());
  const defaultLang = licenseLangCodes.includes(uiLang) ? uiLang : licenseLangCodes[0] || "fr";
  const [datasetLang, setDatasetLang] = useState(defaultLang);
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (open) setDatasetLang(defaultLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultLang]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setDataset([]);
    setSelected(new Set());
    setVisibleCount(PAGE_SIZE);
    fetch(`/data/unesco-places-${datasetLang}.json`)
      .then((r) => (r.ok ? r.json() : fetch("/data/unesco-places-en.json").then((r2) => r2.json())))
      .then((data) => setDataset(data))
      .finally(() => setLoading(false));
  }, [open, datasetLang]);

  // Un même site UNESCO peut être importé plusieurs fois, une fois par
  // langue (ex: importer "Amphithéâtre d'El Jem" en anglais ET en français
  // pour des tuteurs qui travaillent dans des langues différentes). On ne
  // bloque donc que la combinaison site + langue déjà importée, pas le site
  // seul.
  const importedKeys = useMemo(
    () => new Set(existingPlaces.filter((p) => p.source === "unesco").map((p) => `${p.unesco_id}:${p.source_lang || "fr"}`)),
    [existingPlaces]
  );

  // Import par PAYS (et non plus par région) : un site peut relever de
  // plusieurs pays (biens transnationaux, ex. "France,Espagne") — chaque
  // combinaison exacte devient une option de filtre, ce qui reste correct
  // pour retrouver précisément les sites d'un pays donné.
  const countries = useMemo(() => [...new Set(dataset.map((d) => d.country))].sort(), [dataset]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dataset.filter((d) => {
      const matchesQ = !q || d.real_name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q);
      const matchesCountry = !country || d.country === country;
      return matchesQ && matchesCountry;
    });
  }, [dataset, search, country]);

  const visible = filtered.slice(0, visibleCount);

  function toggle(id) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function importSites(items) {
    setImporting(true);
    try {
      const codesInUse = new Set(existingCodes);
      const created = [];
      for (const site of items) {
        const generated = generatePlaceContent(site.real_name);
        const code = generatePlaceCode([...codesInUse]);
        codesInUse.add(code);
        created.push({
          real_name: site.real_name,
          magic_name: generated.fantasy_name,
          emoji: generated.emoji,
          color: generated.color,
          description: site.description,
          enigma_explorateur: generated.enigma_explorateur, enigma_apprenti: generated.enigma_apprenti,
          enigma_aventurier: generated.enigma_aventurier, enigma_expert: generated.enigma_expert,
          hint_explorateur: generated.hint_explorateur, hint_apprenti: generated.hint_apprenti,
          hint_aventurier: generated.hint_aventurier, hint_expert: generated.hint_expert,
          mission_explorateur: generated.mission_explorateur, mission_apprenti: generated.mission_apprenti,
          mission_aventurier: generated.mission_aventurier, mission_expert: generated.mission_expert,
          place_type: site.place_type,
          lat: site.lat, lng: site.lng,
          city: "", country: site.country, region: site.region,
          code, image_url: "", is_active: true, is_adult_content: false, language: datasetLang.toUpperCase(),
          source: "unesco", unesco_id: site.unesco_id, source_url: site.source_url, source_lang: datasetLang,
          license_code: getAdminActiveLicenseCode(),
        });
      }
      await Places.bulkCreate(created);
      toast(`${created.length} ${t("unesco_selected")}`);
      setSelected(new Set());
      onClose(true);
    } finally {
      setImporting(false);
    }
  }

  async function handleImportSelection() {
    const items = dataset.filter((d) => selected.has(d.unesco_id) && !importedKeys.has(`${d.unesco_id}:${datasetLang}`));
    if (items.length === 0) return;
    await importSites(items);
  }

  async function handleImportAll() {
    const ok = await confirm({
      title: t("unesco_import_all"),
      message: `${filtered.length} ${t("unesco_selected")}. Continuer ?`,
      danger: false,
    });
    if (!ok) return;
    const items = filtered.filter((d) => !importedKeys.has(`${d.unesco_id}:${datasetLang}`));
    await importSites(items);
  }

  return (
    <Modal open={open} onClose={() => onClose(false)} title={t("unesco_title")} maxWidth="max-w-2xl">
      <p className="text-sm text-muted mb-4">{t("unesco_intro")}</p>

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
                onClick={() => allowed && setDatasetLang(l.code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm transition-colors ${
                  !allowed
                    ? "opacity-35 cursor-not-allowed border-void-border text-muted"
                    : datasetLang === l.code
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
          <Input className="pl-9 rtl:pl-4 rtl:pr-9" placeholder={t("unesco_search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={country} onChange={(e) => setCountry(e.target.value)} className="sm:w-56">
          <option value="">{t("unesco_country_all")}</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="text-muted text-sm py-8 text-center">{t("common_loading")}</p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto mb-4 pr-1">
            {visible.map((d) => {
              const already = importedKeys.has(`${d.unesco_id}:${datasetLang}`);
              const isSelected = selected.has(d.unesco_id);
              return (
                <button
                  key={d.unesco_id}
                  disabled={already}
                  onClick={() => toggle(d.unesco_id)}
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
                    <p className="text-sm text-parchment truncate">{d.real_name}</p>
                    <p className="text-xs text-muted truncate">{d.country} · {d.region} · {d.date_inscribed}</p>
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
              <Button variant="ghost" size="sm" onClick={handleImportAll} disabled={importing}>
                <Download size={14} /> {t("unesco_import_all")}
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
