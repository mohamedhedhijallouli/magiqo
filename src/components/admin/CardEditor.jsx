import React, { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Input, Label, Textarea, Select, Switch } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";
import { Cards, getAdminActiveLicenseCode, fileToDataUrl, generateObjectId } from "@/lib/db";
import { useToast } from "@/components/ui/Misc";
import { taxonomyLabel } from "@/lib/utils";

// Éditeur d'une carte Personnage — modèle réutilisable créé par l'admin,
// façon Objets/Catégories. Volontairement dépourvu de niveau/rareté : ce
// sont des propriétés de la copie POSSÉDÉE PAR UN JOUEUR (voir
// lib/cardProgression.js), pas du modèle lui-même — tout joueur démarre
// une carte au niveau 0 (Novice), quelle qu'elle soit.
const EMPTY = {
  card_code: "", name: "", is_fictional: false, motto: "", quote: "",
  illustration_url: "", universe: "", is_active: true,
};

export default function CardEditor({ open, onClose, card, universes, existingCodes }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        card
          ? { ...EMPTY, ...card }
          : { ...EMPTY, card_code: "CARD-" + generateObjectId(existingCodes || []), universe: universes[0]?.slug || "" }
      );
    }
  }, [open, card, universes, existingCodes]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    set("illustration_url", await fileToDataUrl(file));
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (card) {
        await Cards.update(card.id, { ...form, license_code: card.license_code || getAdminActiveLicenseCode() });
      } else {
        await Cards.create({ ...form, license_code: getAdminActiveLicenseCode() });
      }
      toast(t("common_saved"));
      onClose(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={() => onClose(false)} title={card ? t("crd_edit") : t("crd_new")}>
      <div className="mb-4">
        <Label>{t("crd_illustration")}</Label>
        <div className="flex items-center gap-3">
          {form.illustration_url ? (
            <div className="relative">
              <img src={form.illustration_url} alt="" className="w-20 h-20 rounded-lg object-cover border border-void-border" />
              <button
                type="button"
                onClick={() => set("illustration_url", "")}
                className="absolute -top-1.5 -right-1.5 bg-void border border-void-border rounded-full p-0.5 text-muted hover:text-ember-bright"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg border border-dashed border-void-border flex items-center justify-center text-3xl text-muted">🃏</div>
          )}
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-void-border hover:border-gold-dim text-sm">
              <Upload size={14} /> {t("oe_upload_image")}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <Label>{t("crd_code")}</Label>
          <Input value={form.card_code} onChange={(e) => set("card_code", e.target.value)} className="font-rune" />
        </div>
        <div>
          <Label>{t("crd_universe")}</Label>
          <Select value={form.universe} onChange={(e) => set("universe", e.target.value)}>
            {universes.map((u) => (
              <option key={u.slug} value={u.slug}>{u.emoji} {taxonomyLabel(u, t)}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mb-4">
        <Label>{t("crd_name")}</Label>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Amilcar Barca" />
      </div>

      <div className="flex items-center justify-between mb-4 p-3 rounded-xl border border-void-border">
        <div>
          <Label className="mb-0">{t("crd_fictional")}</Label>
          <p className="text-xs text-muted">{t("crd_fictional_hint")}</p>
        </div>
        <Switch checked={form.is_fictional} onChange={(v) => set("is_fictional", v)} />
      </div>

      <div className="mb-4">
        <Label>{t("crd_motto")}</Label>
        <Input value={form.motto} onChange={(e) => set("motto", e.target.value)} placeholder={t("crd_motto_placeholder")} />
      </div>

      <div className="mb-6">
        <Label>{t("crd_quote")}</Label>
        <Textarea value={form.quote} onChange={(e) => set("quote", e.target.value)} rows={2} placeholder={t("crd_quote_placeholder")} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <Label className="mb-0">{t("crd_active")}</Label>
        <Switch checked={form.is_active} onChange={(v) => set("is_active", v)} />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => onClose(false)}>{t("common_cancel")}</Button>
        <Button onClick={handleSave} disabled={!form.name || !form.universe || saving}>
          {t("common_save")}
        </Button>
      </div>
    </Modal>
  );
}
