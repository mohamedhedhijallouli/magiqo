import React, { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Download, Trash } from "lucide-react";
import { Animals, AnimalTypes, subscribe, getAdminActiveLicenseCode } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import { taxonomyLabel } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { EmptyState, useConfirm, useToast } from "@/components/ui/Misc";
import AnimalEditor from "@/components/admin/AnimalEditor";
import CatalogImportPanel from "@/components/admin/CatalogImportPanel";

export default function AnimalsManager() {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const [animals, setAnimals] = useState([]);
  const [types, setTypes] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteType, setDeleteType] = useState("");

  async function load() {
    const license_code = getAdminActiveLicenseCode();
    setAnimals(await Animals.filter({ license_code }, "-created_date"));
    setTypes(await AnimalTypes.filter({ license_code }));
  }
  useEffect(() => {
    load();
    return subscribe((name) => (name === "animals" || name === "animal_types") && load());
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    animals.forEach((a) => {
      const key = a.type || "autre";
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [animals]);

  async function handleDelete(a) {
    const ok = await confirm({ title: t("confirm_delete_title"), message: t("confirm_delete_msg") });
    if (!ok) return;
    await Animals.remove(a.id);
    toast(t("common_deleted"));
  }

  async function handleDeleteAll() {
    if (animals.length === 0) return;
    const ok = await confirm({ title: t("bulk_delete_all"), message: t("bulk_delete_all_confirm") });
    if (!ok) return;
    await Promise.all(animals.map((a) => Animals.remove(a.id)));
    toast(t("bulk_delete_done"));
  }

  async function handleDeleteType() {
    if (!deleteType) return;
    const toRemove = animals.filter((a) => a.type === deleteType);
    if (toRemove.length === 0) return;
    const ok = await confirm({ title: t("bulk_delete_category"), message: t("bulk_delete_type_confirm") });
    if (!ok) return;
    await Promise.all(toRemove.map((a) => Animals.remove(a.id)));
    setDeleteType("");
    toast(t("bulk_delete_done"));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
        <h2 className="font-display text-xl text-parchment">{t("am_title")}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setImportOpen(true)}>
            <Download size={15} /> {t("cat_import_title_animals")}
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setEditorOpen(true); }}>
            <Plus size={16} /> {t("am_new")}
          </Button>
        </div>
      </div>

      {animals.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-6 p-3 bg-void/30 border border-void-border rounded-xl">
          <div className="flex-1 flex gap-2">
            <Select value={deleteType} onChange={(e) => setDeleteType(e.target.value)} className="flex-1">
              <option value="">{t("bulk_delete_pick_type")}</option>
              {types.map((tp) => (
                <option key={tp.slug} value={tp.slug}>{tp.emoji} {taxonomyLabel(tp, t)}</option>
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

      {animals.length === 0 ? (
        <EmptyState icon="🐾" title={t("am_empty")} />
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([type, items]) => {
            const typeInfo = types.find((tp) => tp.slug === type);
            return (
              <div key={type}>
                <h3 className="text-sm font-bold text-muted uppercase tracking-wide mb-3">
                  {typeInfo ? `${typeInfo.emoji} ${taxonomyLabel(typeInfo, t)}` : type}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((a, i) => (
                    <div key={a.id} style={{ animationDelay: `${i * 45}ms` }} className="animate-pop-in bg-void-panel/60 border border-void-border rounded-xl p-4 flex gap-3 hover:-translate-y-0.5 transition-transform">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 bg-white/5">
                        {a.image_url ? <img src={a.image_url} className="w-full h-full object-cover rounded-lg" /> : a.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-parchment truncate">{a.fantasy_name}</p>
                        <p className="text-xs text-muted truncate">{a.real_name}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => { setEditing(a); setEditorOpen(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-parchment">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(a)} className="p-1.5 rounded-lg hover:bg-ember/10 text-muted hover:text-ember-bright">
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

      <AnimalEditor open={editorOpen} onClose={(changed) => { setEditorOpen(false); if (changed) load(); }} animal={editing} types={types} existingCodes={animals.map((a) => a.code).filter(Boolean)} />

      <CatalogImportPanel
        open={importOpen}
        onClose={(changed) => { setImportOpen(false); if (changed) load(); }}
        kind="animal"
        existingItems={animals}
        existingIds={animals.map((a) => a.code).filter(Boolean)}
        typeOptions={types.map((tp) => ({ slug: tp.slug, emoji: tp.emoji, label: taxonomyLabel(tp, t) }))}
      />
    </div>
  );
}
