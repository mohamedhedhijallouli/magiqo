import React, { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Globe2, MapPin, Trash } from "lucide-react";
import { Places, PlaceTypes, subscribe, getAdminActiveLicenseCode } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import { taxonomyLabel } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState, Badge, useConfirm, useToast } from "@/components/ui/Misc";
import PlaceEditor from "@/components/admin/PlaceEditor";
import UnescoImportPanel from "@/components/admin/UnescoImportPanel";

export default function PlacesManager() {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const [places, setPlaces] = useState([]);
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [unescoOpen, setUnescoOpen] = useState(false);
  const [deleteType, setDeleteType] = useState("");

  async function load() {
    const license_code = getAdminActiveLicenseCode();
    setPlaces(await Places.filter({ license_code }, "-created_date"));
    setTypes(await PlaceTypes.filter({ license_code }));
  }
  useEffect(() => {
    load();
    return subscribe((name) => (name === "places" || name === "place_types") && load());
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return places;
    return places.filter(
      (p) => p.real_name?.toLowerCase().includes(q) || p.magic_name?.toLowerCase().includes(q) || p.country?.toLowerCase().includes(q)
    );
  }, [places, search]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((p) => {
      const key = p.place_type || "autre";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [filtered]);

  async function handleDelete(p) {
    const ok = await confirm({ title: t("confirm_delete_title"), message: t("confirm_delete_msg") });
    if (!ok) return;
    await Places.remove(p.id);
    toast(t("common_deleted"));
  }

  async function handleDeleteAll() {
    if (places.length === 0) return;
    const ok = await confirm({ title: t("bulk_delete_all"), message: t("bulk_delete_all_confirm") });
    if (!ok) return;
    await Promise.all(places.map((p) => Places.remove(p.id)));
    toast(t("bulk_delete_done"));
  }

  async function handleDeleteType() {
    if (!deleteType) return;
    const toRemove = places.filter((p) => p.place_type === deleteType);
    if (toRemove.length === 0) return;
    const ok = await confirm({ title: t("bulk_delete_category"), message: t("bulk_delete_type_confirm") });
    if (!ok) return;
    await Promise.all(toRemove.map((p) => Places.remove(p.id)));
    setDeleteType("");
    toast(t("bulk_delete_done"));
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-stretch sm:items-center justify-between">
        <h2 className="font-display text-xl text-parchment">{t("pl_title")}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setUnescoOpen(true)}>
            <Globe2 size={16} /> {t("unesco_title")}
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setEditorOpen(true); }}>
            <Plus size={16} /> {t("pl_new")}
          </Button>
        </div>
      </div>

      <Input className="mb-4" placeholder={t("pl_search")} value={search} onChange={(e) => setSearch(e.target.value)} />

      {places.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-6 p-3 bg-void/30 border border-void-border rounded-xl">
          <div className="flex-1 flex gap-2">
            <Select value={deleteType} onChange={(e) => setDeleteType(e.target.value)} className="flex-1">
              <option value="">{t("bulk_delete_pick_type")}</option>
              {types.map((ty) => (
                <option key={ty.slug} value={ty.slug}>{ty.emoji} {taxonomyLabel(ty, t)}</option>
              ))}
            </Select>
            <Button size="sm" variant="ghost" onClick={handleDeleteType} disabled={!deleteType}>
              <Trash2 size={14} className="text-ember" /> {t("common_delete")}
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={handleDeleteAll}>
            <Trash size={14} className="text-ember" /> {t("bulk_delete_all")}
          </Button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon="🗺️" title={t("pl_empty")} />
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([typeSlug, items]) => {
            const typeInfo = types.find((ty) => ty.slug === typeSlug);
            return (
              <div key={typeSlug}>
                <h3 className="text-sm font-bold text-muted uppercase tracking-wide mb-3">
                  {typeInfo ? `${typeInfo.emoji} ${taxonomyLabel(typeInfo, t)}` : typeSlug}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((p) => (
                    <div key={p.id} className="bg-void-panel/60 border border-void-border rounded-xl p-4 flex gap-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0" style={{ background: `${p.color || "#8B7BF0"}22` }}>
                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover rounded-lg" /> : (p.emoji || "🏛️")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-parchment truncate">{p.magic_name || p.real_name}</p>
                        <p className="text-xs text-muted truncate flex items-center gap-1">
                          <MapPin size={10} /> {p.country || "—"} {p.code && <span className="font-rune ml-1">· {p.code}</span>}
                        </p>
                        {p.source === "unesco" && <Badge color="arcane" className="mt-1">UNESCO</Badge>}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => { setEditing(p); setEditorOpen(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-parchment">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(p)} className="p-1.5 rounded-lg hover:bg-ember/10 text-muted hover:text-ember-bright">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PlaceEditor
        open={editorOpen}
        onClose={(changed) => { setEditorOpen(false); if (changed) load(); }}
        place={editing}
        placeTypes={types}
        places={places}
        existingCodes={places.map((p) => p.code).filter(Boolean)}
      />
      <UnescoImportPanel
        open={unescoOpen}
        onClose={(changed) => { setUnescoOpen(false); if (changed) load(); }}
        existingPlaces={places}
        existingCodes={places.map((p) => p.code).filter(Boolean)}
      />
    </div>
  );
}
