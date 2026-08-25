import React, { useState, useEffect } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { subscribe, getAdminActiveLicenseCode } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import { taxonomyLabel } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input, Label, Switch } from "@/components/ui/Field";
import { EmptyState, useConfirm, useToast, Badge } from "@/components/ui/Misc";

function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export default function TaxonomyManager({
  collection,
  collectionName,
  titleKey,
  newKey,
  emptyKey,
  showAllowsElements = false,
}) {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ label: "", emoji: "📦", allows_elements: false });

  async function load() {
    setItems(await collection.filter({ license_code: getAdminActiveLicenseCode() }, "label"));
  }
  useEffect(() => {
    load();
    return subscribe((name) => name === collectionName && load());
  }, []);

  function openNew() {
    setEditing(null);
    setForm({ label: "", emoji: "📦", allows_elements: false });
    setOpen(true);
  }
  function openEdit(item) {
    setEditing(item);
    setForm({ label: taxonomyLabel(item, t), emoji: item.emoji, allows_elements: !!item.allows_elements });
    setOpen(true);
  }

  async function handleSave() {
    if (editing) {
      await collection.update(editing.id, {
        label: form.label,
        label_key: null,
        emoji: form.emoji,
        ...(showAllowsElements ? { allows_elements: form.allows_elements } : {}),
      });
    } else {
      await collection.create({
        label: form.label,
        emoji: form.emoji,
        slug: slugify(form.label),
        license_code: getAdminActiveLicenseCode(),
        ...(showAllowsElements ? { allows_elements: form.allows_elements } : {}),
      });
    }
    toast(t("common_saved"));
    setOpen(false);
  }

  async function handleDelete(item) {
    const ok = await confirm({ title: t("confirm_delete_title"), message: t("confirm_delete_msg") });
    if (!ok) return;
    await collection.remove(item.id);
    toast(t("common_deleted"));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl text-parchment">{t(titleKey)}</h2>
        <Button size="sm" onClick={openNew}>
          <Plus size={16} /> {t(newKey)}
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="🏷️" title={t(emptyKey)} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-2 bg-void-panel/60 border border-void-border rounded-xl px-3 py-2 text-sm">
              <span>{it.emoji}</span>
              <span className="text-parchment">{taxonomyLabel(it, t)}</span>
              {showAllowsElements && it.allows_elements && <Badge color="gold">🧱</Badge>}
              <button onClick={() => openEdit(it)} className="text-muted hover:text-arcane ml-1">
                <Pencil size={13} />
              </button>
              <button onClick={() => handleDelete(it)} className="text-muted hover:text-ember-bright">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t("common_edit") : t(newKey)} maxWidth="max-w-sm">
        <div className="grid grid-cols-[1fr_80px] gap-3 mb-4">
          <div>
            <Label>{t("cm_label")}</Label>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div>
            <Label>{t("oe_emoji")}</Label>
            <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} maxLength={4} />
          </div>
        </div>
        {showAllowsElements && (
          <div className="flex items-center justify-between mb-4">
            <Label className="mb-0">{t("plt_allows_elements")}</Label>
            <Switch checked={form.allows_elements} onChange={(v) => setForm({ ...form, allows_elements: v })} />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>{t("common_cancel")}</Button>
          <Button onClick={handleSave} disabled={!form.label}>{t("common_save")}</Button>
        </div>
      </Modal>
    </div>
  );
}
