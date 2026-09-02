import React, { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Package, PawPrint, Landmark } from "lucide-react";
import { ParcoursTypes, subscribe, getAdminActiveLicenseCode } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import { taxonomyLabel } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input, Label } from "@/components/ui/Field";
import { EmptyState, useConfirm, useToast, Badge } from "@/components/ui/Misc";
import { cn } from "@/lib/utils";

function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

const KINDS = [
  { value: "object", icon: Package, labelKey: "ptm_kind_object", color: "gold" },
  { value: "animal", icon: PawPrint, labelKey: "ptm_kind_animal", color: "emerald" },
  { value: "place", icon: Landmark, labelKey: "ptm_kind_place", color: "arcane" },
];

const EMPTY = { label: "", emoji: "✨", kind: "object" };

export default function ParcoursTypesManager() {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  async function load() {
    setItems(await ParcoursTypes.filter({ license_code: getAdminActiveLicenseCode() }, "label"));
  }
  useEffect(() => {
    load();
    return subscribe((name) => name === "parcours_types" && load());
  }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }
  function openEdit(item) {
    setEditing(item);
    setForm({ label: taxonomyLabel(item, t), emoji: item.emoji, kind: item.kind || "object" });
    setOpen(true);
  }

  async function handleSave() {
    if (editing) {
      await ParcoursTypes.update(editing.id, {
        label: form.label,
        label_key: null,
        emoji: form.emoji,
        kind: form.kind,
      });
    } else {
      await ParcoursTypes.create({
        label: form.label,
        emoji: form.emoji,
        slug: slugify(form.label),
        kind: form.kind,
        license_code: getAdminActiveLicenseCode(),
      });
    }
    toast(t("common_saved"));
    setOpen(false);
  }

  async function handleDelete(item) {
    const ok = await confirm({ title: t("confirm_delete_title"), message: t("confirm_delete_msg") });
    if (!ok) return;
    await ParcoursTypes.remove(item.id);
    toast(t("common_deleted"));
  }

  function kindMeta(kind) {
    return KINDS.find((k) => k.value === kind) || KINDS[0];
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl text-parchment">{t("ptm_title")}</h2>
        <Button size="sm" onClick={openNew}>
          <Plus size={16} /> {t("ptm_new")}
        </Button>
      </div>

      <p className="text-xs text-muted mb-4">{t("ptm_intro")}</p>

      {items.length === 0 ? (
        <EmptyState icon="🗂️" title={t("ptm_empty")} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => {
            const km = kindMeta(it.kind);
            const KIcon = km.icon;
            return (
              <div key={it.id} className="flex items-center gap-2 bg-void-panel/60 border border-void-border rounded-xl px-3 py-2 text-sm">
                <span>{it.emoji}</span>
                <span className="text-parchment">{taxonomyLabel(it, t)}</span>
                <Badge color={km.color} className="ml-1">
                  <KIcon size={11} /> {t(km.labelKey)}
                </Badge>
                <button onClick={() => openEdit(it)} className="text-muted hover:text-arcane ml-1">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(it)} className="text-muted hover:text-ember-bright">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t("common_edit") : t("ptm_new")} maxWidth="max-w-sm">
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

        <Label className="mb-2">{t("ptm_kind")}</Label>
        <p className="text-xs text-muted mb-2">{t("ptm_kind_hint")}</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {KINDS.map((k) => {
            const KIcon = k.icon;
            const active = form.kind === k.value;
            return (
              <button
                type="button"
                key={k.value}
                onClick={() => setForm({ ...form, kind: k.value })}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs transition-colors",
                  active ? "bg-gold/15 border-gold-dim text-gold-bright" : "bg-void/40 border-void-border text-muted hover:border-white/25"
                )}
              >
                <KIcon size={18} />
                {t(k.labelKey)}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>{t("common_cancel")}</Button>
          <Button onClick={handleSave} disabled={!form.label}>{t("common_save")}</Button>
        </div>
      </Modal>
    </div>
  );
}
