import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Ban, CheckCircle2, Download, Trash } from "lucide-react";
import { GameObjects, Categories, subscribe, getAdminActiveLicenseCode } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import { taxonomyLabel } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState, useConfirm } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Misc";
import ObjectEditor from "@/components/parent/ObjectEditor";
import CatalogImportPanel from "@/components/admin/CatalogImportPanel";

export default function ObjectsManager() {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const [objects, setObjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState("");

  async function load() {
    const license_code = getAdminActiveLicenseCode();
    setObjects(await GameObjects.filter({ license_code }, "-created_date"));
    setCategories(await Categories.filter({ license_code }));
  }
  useEffect(() => {
    load();
    return subscribe((name) => (name === "game_objects" || name === "categories") && load());
  }, []);

  const filtered = useMemo(() => {
    return objects.filter((o) => {
      const matchesSearch = !search || o.real_name?.toLowerCase().includes(search.toLowerCase()) || o.fantasy_name?.toLowerCase().includes(search.toLowerCase());
      const matchesCat = !category || o.category === category;
      return matchesSearch && matchesCat;
    });
  }, [objects, search, category]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((o) => {
      const key = o.category || "autre";
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [filtered]);

  async function handleDelete(obj) {
    const ok = await confirm({ title: t("confirm_delete_title"), message: t("confirm_delete_msg") });
    if (!ok) return;
    await GameObjects.remove(obj.id);
    toast(t("common_deleted"));
  }

  // Suppression en masse : tous les objets d'un coup, ou tous ceux d'une
  // catégorie donnée.
  async function handleDeleteAll() {
    if (objects.length === 0) return;
    const ok = await confirm({ title: t("bulk_delete_all"), message: t("bulk_delete_all_confirm") });
    if (!ok) return;
    await Promise.all(objects.map((o) => GameObjects.remove(o.id)));
    toast(t("bulk_delete_done"));
  }

  async function handleDeleteCategory() {
    if (!deleteCategory) return;
    const toRemove = objects.filter((o) => o.category === deleteCategory);
    if (toRemove.length === 0) return;
    const ok = await confirm({ title: t("bulk_delete_category"), message: t("bulk_delete_category_confirm") });
    if (!ok) return;
    await Promise.all(toRemove.map((o) => GameObjects.remove(o.id)));
    setDeleteCategory("");
    toast(t("bulk_delete_done"));
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-stretch sm:items-center justify-between">
        <h2 className="font-display text-xl text-parchment">{t("om_title")}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setImportOpen(true)}>
            <Download size={15} /> {t("cat_import_title_objects")}
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setEditorOpen(true); }}>
            <Plus size={16} /> {t("om_new_object")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input className="pl-9 rtl:pl-4 rtl:pr-9" placeholder={t("om_search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-void/60 border border-void-border text-parchment text-sm"
        >
          <option value="">{t("om_category_all")}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.emoji} {taxonomyLabel(c, t)}</option>
          ))}
        </select>
      </div>

      {/* Suppression en masse */}
      {objects.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-6 p-3 bg-void/30 border border-void-border rounded-xl">
          <div className="flex-1 flex gap-2">
            <Select value={deleteCategory} onChange={(e) => setDeleteCategory(e.target.value)} className="flex-1">
              <option value="">{t("bulk_delete_pick_category")}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.emoji} {taxonomyLabel(c, t)}</option>
              ))}
            </Select>
            <Button size="sm" variant="ghost" onClick={handleDeleteCategory} disabled={!deleteCategory}>
              <Trash2 size={14} className="text-ember" /> {t("common_delete")}
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={handleDeleteAll}>
            <Trash size={14} className="text-ember" /> {t("bulk_delete_all")}
          </Button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon="📦" title={t("om_empty")} />
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([cat, items]) => {
            const catInfo = categories.find((c) => c.slug === cat);
            return (
              <div key={cat}>
                <h3 className="text-sm font-bold text-muted uppercase tracking-wide mb-3">
                  {catInfo ? `${catInfo.emoji} ${taxonomyLabel(catInfo, t)}` : cat}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((o, i) => (
                    <div
                      key={o.id}
                      style={{ animationDelay: `${i * 45}ms` }}
                      className="animate-pop-in bg-void-panel/60 border border-void-border rounded-xl p-4 flex gap-3 hover:border-gold-dim/50 hover:-translate-y-0.5 transition-all"
                    >  <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
                        style={{ background: `${o.color}22` }}
                      >
                        {o.image_url ? <img src={o.image_url} className="w-full h-full object-cover rounded-lg" /> : o.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-parchment truncate">{o.fantasy_name}</p>
                        <p className="text-xs text-muted truncate">{o.real_name} · <span className="font-rune">{o.object_id}</span></p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => { setEditing(o); setEditorOpen(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-parchment">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(o)} className="p-1.5 rounded-lg hover:bg-ember/10 text-muted hover:text-ember-bright">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {!o.is_active && (
                        <span className="absolute"><Ban size={0} /></span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ObjectEditor
        open={editorOpen}
        onClose={(changed) => { setEditorOpen(false); if (changed) load(); }}
        object={editing}
        categories={categories}
        existingIds={objects.map((o) => o.object_id)}
      />

      <CatalogImportPanel
        open={importOpen}
        onClose={(changed) => { setImportOpen(false); if (changed) load(); }}
        kind="object"
        existingItems={objects}
        existingIds={objects.map((o) => o.object_id)}
        typeOptions={categories.map((c) => ({ slug: c.slug, emoji: c.emoji, label: taxonomyLabel(c, t) }))}
      />
    </div>
  );
}
