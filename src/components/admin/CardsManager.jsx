import React, { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Ban, CheckCircle2 } from "lucide-react";
import { Cards, CardUniverses, subscribe, getAdminActiveLicenseCode } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import { taxonomyLabel } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState, useConfirm, useToast, Badge } from "@/components/ui/Misc";
import CardEditor from "@/components/admin/CardEditor";

// Gestion des cartes Personnage — façon ObjectsManager.jsx, mais pour la
// bibliothèque de personnages réutilisables entre parcours (voir la liaison
// Type de parcours -> Univers de cartes dans ParcoursTypesManager.jsx).
export default function CardsManager() {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const [cards, setCards] = useState([]);
  const [universes, setUniverses] = useState([]);
  const [search, setSearch] = useState("");
  const [universeFilter, setUniverseFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);

  async function load() {
    const license_code = getAdminActiveLicenseCode();
    setCards(await Cards.filter({ license_code }, "-created_date"));
    setUniverses(await CardUniverses.filter({ license_code }));
  }
  useEffect(() => {
    load();
    return subscribe((name) => { if (name === "cards" || name === "card_universes") load(); });
  }, []);

  const filtered = cards.filter(
    (c) =>
      (!universeFilter || c.universe === universeFilter) &&
      (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleDelete(c) {
    const ok = await confirm({ title: t("common_delete"), message: t("crd_delete_confirm").replace("{name}", c.name) });
    if (!ok) return;
    await Cards.remove(c.id);
    toast(t("common_deleted"));
  }
  async function toggleActive(c) {
    await Cards.update(c.id, { is_active: !c.is_active });
  }

  const universeLabel = (slug) => {
    const u = universes.find((x) => x.slug === slug);
    return u ? `${u.emoji} ${taxonomyLabel(u, t)}` : slug;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg text-gold-bright">{t("crd_title")}</h2>
          <p className="text-xs text-muted">{t("crd_subtitle")}</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setEditorOpen(true); }} disabled={universes.length === 0}>
          <Plus size={16} /> {t("crd_new")}
        </Button>
      </div>

      {universes.length === 0 && (
        <p className="text-sm text-arcane bg-arcane/10 border border-arcane/30 rounded-xl px-4 py-3 mb-4">
          {t("crd_no_universe_hint")}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input className="pl-8" placeholder={t("pe_search_object")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="sm:w-56" value={universeFilter} onChange={(e) => setUniverseFilter(e.target.value)}>
          <option value="">{t("crd_all_universes")}</option>
          {universes.map((u) => (
            <option key={u.slug} value={u.slug}>{u.emoji} {taxonomyLabel(u, t)}</option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🃏" title={t("crd_empty_title")} description={t("crd_empty_desc")} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border border-void-border bg-void/40 overflow-hidden">
              <div className="h-32 bg-void-panel2 flex items-center justify-center">
                {c.illustration_url ? (
                  <img src={c.illustration_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🃏</span>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-rune text-[10px] text-gold-dim">{c.card_code}</span>
                  {!c.is_active && <Badge color="ember">{t("common_inactive")}</Badge>}
                </div>
                <p className="font-semibold text-parchment text-sm truncate">{c.name}</p>
                <Badge color="arcane" className="mt-1">{universeLabel(c.universe)}</Badge>
                <div className="flex items-center gap-1 mt-2">
                  <button onClick={() => { setEditing(c); setEditorOpen(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-parchment">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => toggleActive(c)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-parchment">
                    {c.is_active ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                  </button>
                  <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg hover:bg-ember/10 text-muted hover:text-ember-bright">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CardEditor
        open={editorOpen}
        onClose={(changed) => { setEditorOpen(false); if (changed) load(); }}
        card={editing}
        universes={universes}
        existingCodes={cards.map((c) => c.card_code?.replace("CARD-", "")).filter(Boolean)}
      />
    </div>
  );
}
