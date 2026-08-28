import React, { useState, useEffect } from "react";
import { Upload, Dice5, Wand2, Sparkles } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Input, Label, Textarea, Select, Switch } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";
import { Animals, fileToDataUrl, generateObjectId, getAdminActiveLicenseCode } from "@/lib/db";
import { getActiveLicense } from "@/lib/auth";
import { useToast } from "@/components/ui/Misc";
import { generateAnimalContent, randomAnimalRealName } from "@/lib/aiGenerator";
import { taxonomyLabel } from "@/lib/utils";
import LevelContentEditor from "@/components/shared/LevelContentEditor";
import LanguageIndicator from "@/components/shared/LanguageIndicator";

const EMPTY = {
  real_name: "", fantasy_name: "", emoji: "🐾", type: "", description: "", image_url: "", is_active: true, code: "", language: "",
  enigma_explorateur: "", enigma_apprenti: "", enigma_aventurier: "", enigma_expert: "",
  hint_explorateur: "", hint_apprenti: "", hint_aventurier: "", hint_expert: "",
  mission_explorateur: "", mission_apprenti: "", mission_aventurier: "", mission_expert: "",
};

export default function AnimalEditor({ open, onClose, animal, types, existingCodes = [] }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const defaultLang = (getActiveLicense()?.languages?.[0] || "FR").toUpperCase();
      setForm(animal ? { ...EMPTY, ...animal } : { ...EMPTY, language: defaultLang, code: generateObjectId(existingCodes) });
    }
  }, [open, animal]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Voir ObjectEditor : le générateur local ne sait écrire qu'en français.
  const isFrench = (form.language || "FR").toUpperCase() === "FR";

  function applyGenerated(realName) {
    const generated = generateAnimalContent(realName, types);
    setForm((f) => ({ ...f, real_name: realName, ...generated }));
  }

  function handleRandomAnimal() {
    applyGenerated(randomAnimalRealName());
  }

  function handleAutofill() {
    if (!form.real_name.trim()) return;
    applyGenerated(form.real_name.trim());
  }

  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    set("image_url", await fileToDataUrl(file));
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (animal) await Animals.update(animal.id, { ...form, license_code: animal.license_code || getAdminActiveLicenseCode() });
      else await Animals.create({ ...form, license_code: getAdminActiveLicenseCode() });
      toast(t("common_saved"));
      onClose(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={() => onClose(false)} title={animal ? t("ae_title_edit") : t("ae_title_new")} maxWidth="max-w-2xl">
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <Button type="button" variant="arcane" size="sm" onClick={handleRandomAnimal} disabled={!!animal || !isFrench}>
          <Dice5 size={15} /> {t("ae_random")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleAutofill} disabled={!form.real_name.trim() || !isFrench}>
          <Wand2 size={15} /> {t("ae_autofill")}
        </Button>
        <LanguageIndicator value={form.language} onChange={(l) => set("language", l)} />
      </div>
      {!isFrench && (
        <p className="text-xs text-ember-bright/90 mb-3">{t("autofill_language_note")}</p>
      )}
      <p className="text-xs text-muted flex items-center gap-1.5 mb-5">
        <Sparkles size={12} className="text-arcane shrink-0" /> {t("ae_ai_note")}
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <Label>{t("ae_real_name")}</Label>
          <Input value={form.real_name} onChange={(e) => set("real_name", e.target.value)} />
        </div>
        <div>
          <Label>{t("ae_fantasy_name")}</Label>
          <Input value={form.fantasy_name} onChange={(e) => set("fantasy_name", e.target.value)} />
        </div>
        <div>
          <Label>{t("oe_emoji")}</Label>
          <Input value={form.emoji} onChange={(e) => set("emoji", e.target.value)} maxLength={4} />
        </div>
        <div>
          <Label>{t("ae_type")}</Label>
          <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
            <option value="">—</option>
            {types.map((tp) => (
              <option key={tp.slug} value={tp.slug}>{tp.emoji} {taxonomyLabel(tp, t)}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-end gap-3 sm:col-span-2">
          <div className="flex-1">
            <Label>{t("oe_object_id")}</Label>
            <Input value={form.code || ""} readOnly className="font-rune tracking-widest text-center uppercase" />
          </div>
          <Button variant="ghost" size="md" type="button" onClick={() => set("code", generateObjectId(existingCodes))}>
            <Dice5 size={18} />
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Label>{t("oe_description")}</Label>
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
      </div>

      <div className="mb-4">
        <Label>{t("ae_image")}</Label>
        <div className="flex items-center gap-3">
          {form.image_url && <img src={form.image_url} alt="" className="w-14 h-14 rounded-lg object-cover border border-void-border" />}
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-void-border hover:border-gold-dim text-sm">
              <Upload size={14} /> {t("oe_upload_image")}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        </div>
      </div>

      <LevelContentEditor form={form} set={set} />

      <div className="flex items-center justify-between mb-6">
        <Label className="mb-0">{t("ae_is_active")}</Label>
        <Switch checked={form.is_active} onChange={(v) => set("is_active", v)} />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => onClose(false)}>{t("common_cancel")}</Button>
        <Button onClick={handleSave} disabled={!form.real_name || !form.fantasy_name || saving}>{t("common_save")}</Button>
      </div>
    </Modal>
  );
}
