import React, { useState, useEffect } from "react";
import { Dice5, Upload, Wand2, Sparkles } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Input, Label, Textarea, Select, Switch } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";
import { GameObjects, fileToDataUrl, generateObjectId, getAdminActiveLicenseCode } from "@/lib/db";
import { computePerceptualHash } from "@/lib/perceptualHash";
import { getActiveLicense } from "@/lib/auth";
import { useToast } from "@/components/ui/Misc";
import { generateObjectContent, randomObjectRealName } from "@/lib/aiGenerator";
import { taxonomyLabel } from "@/lib/utils";
import LevelContentEditor from "@/components/shared/LevelContentEditor";
import LanguageIndicator from "@/components/shared/LanguageIndicator";

const EMPTY = {
  real_name: "", fantasy_name: "", emoji: "✨", category: "", color: "#8B7BF0",
  description: "", image_url: "", is_active: true, language: "",
  validation_mode: "code", photo_hash: "", photo_threshold: 85,
  enigma_explorateur: "", enigma_apprenti: "", enigma_aventurier: "", enigma_expert: "",
  hint_explorateur: "", hint_apprenti: "", hint_aventurier: "", hint_expert: "",
  mission_explorateur: "", mission_apprenti: "", mission_aventurier: "", mission_expert: "",
};

export default function ObjectEditor({ open, onClose, object, categories, existingIds }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const defaultLang = (getActiveLicense()?.languages?.[0] || "FR").toUpperCase();
      setForm(object ? { ...EMPTY, ...object } : { ...EMPTY, language: defaultLang, object_id: generateObjectId(existingIds) });
    }
  }, [open, object]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Le générateur local ("Compléter automatiquement" / "Aléatoire") ne sait
  // écrire qu'en français — le taguer avec une autre langue produirait un
  // contenu français faussement étiqueté (ce qui causait des objets en
  // français chez des tuteurs anglais, etc.). On le désactive donc en
  // dehors du français.
  const isFrench = (form.language || "FR").toUpperCase() === "FR";

  function applyGenerated(realName) {
    const generated = generateObjectContent(realName, categories);
    setForm((f) => ({ ...f, real_name: realName, ...generated }));
  }

  function handleRandomObject() {
    applyGenerated(randomObjectRealName());
  }

  function handleAutofill() {
    if (!form.real_name.trim()) return;
    applyGenerated(form.real_name.trim());
  }

  const [computingHash, setComputingHash] = useState(false);

  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    set("image_url", dataUrl);
    // On calcule l'empreinte de référence à l'upload, indépendamment du mode
    // de validation choisi : elle est ainsi déjà prête si l'admin bascule sur
    // "Photo (sans IA)" plus tard, et sert aussi de repli si le mode IA est
    // choisi mais que l'endpoint est indisponible au moment du jeu.
    setComputingHash(true);
    try {
      const hash = await computePerceptualHash(dataUrl);
      set("photo_hash", hash);
    } finally {
      setComputingHash(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (object) {
        await GameObjects.update(object.id, form);
      } else {
        await GameObjects.create({ ...form, license_code: getAdminActiveLicenseCode() });
      }
      toast(t("common_saved"));
      onClose(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={() => onClose(false)} title={object ? t("oe_title_edit") : t("oe_title_new")} maxWidth="max-w-2xl">
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <Button type="button" variant="arcane" size="sm" onClick={handleRandomObject} disabled={!!object || !isFrench}>
          <Dice5 size={15} /> {t("oe_random")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleAutofill} disabled={!form.real_name.trim() || !isFrench}>
          <Wand2 size={15} /> {t("oe_autofill")}
        </Button>
        <LanguageIndicator value={form.language} onChange={(l) => set("language", l)} />
      </div>
      {!isFrench && (
        <p className="text-xs text-ember-bright/90 mb-3">{t("autofill_language_note")}</p>
      )}
      <p className="text-xs text-muted flex items-center gap-1.5 mb-5">
        <Sparkles size={12} className="text-arcane shrink-0" /> {t("oe_ai_note")}
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <Label>{t("oe_real_name")}</Label>
          <Input value={form.real_name} onChange={(e) => set("real_name", e.target.value)} />
        </div>
        <div>
          <Label>{t("oe_fantasy_name")}</Label>
          <Input value={form.fantasy_name} onChange={(e) => set("fantasy_name", e.target.value)} />
        </div>
        <div>
          <Label>{t("oe_emoji")}</Label>
          <Input value={form.emoji} onChange={(e) => set("emoji", e.target.value)} maxLength={4} />
        </div>
        <div>
          <Label>{t("oe_category")}</Label>
          <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji} {taxonomyLabel(c, t)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t("oe_color")}</Label>
          <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} className="w-full h-11 rounded-xl bg-transparent border border-void-border cursor-pointer" />
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label>{t("oe_object_id")}</Label>
            <Input value={form.object_id || ""} readOnly className="font-rune tracking-widest text-center uppercase" />
          </div>
          <Button variant="ghost" size="md" type="button" onClick={() => set("object_id", generateObjectId(existingIds))}>
            <Dice5 size={18} />
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Label>{t("oe_description")}</Label>
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
      </div>

      <div className="mb-4">
        <Label>{t("oe_image")}</Label>
        <div className="flex items-center gap-3">
          {form.image_url && <img src={form.image_url} alt="" className="w-14 h-14 rounded-lg object-cover border border-void-border" />}
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-void-border hover:border-gold-dim text-sm">
              <Upload size={14} /> {t("oe_upload_image")}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
          {computingHash && <span className="text-xs text-muted">{t("oe_hash_computing")}</span>}
        </div>
      </div>

      <div className="mb-4 p-4 rounded-xl border border-void-border bg-white/[0.02]">
        <Label>{t("oe_validation_mode")}</Label>
        <p className="text-xs text-muted mb-3">{t("oe_validation_mode_hint")}</p>
        <Select value={form.validation_mode} onChange={(e) => set("validation_mode", e.target.value)}>
          <option value="code">{t("oe_validation_code")}</option>
          <option value="photo_local">{t("oe_validation_photo_local")}</option>
          <option value="photo_ai">{t("oe_validation_photo_ai")}</option>
        </Select>

        {(form.validation_mode === "photo_local" || form.validation_mode === "photo_ai") && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {form.photo_hash ? (
              <span className="text-emerald">{t("oe_hash_ready")}</span>
            ) : (
              <span className="text-ember-bright">{t("oe_hash_missing")}</span>
            )}
          </div>
        )}
        {form.validation_mode === "photo_ai" && (
          <p className="text-xs text-arcane mt-2">{t("oe_validation_ai_note")}</p>
        )}
      </div>

      <LevelContentEditor form={form} set={set} />

      <div className="flex items-center justify-between mb-6">
        <Label className="mb-0">{t("oe_is_active")}</Label>
        <Switch checked={form.is_active} onChange={(v) => set("is_active", v)} />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => onClose(false)}>{t("common_cancel")}</Button>
        <Button onClick={handleSave} disabled={!form.real_name || !form.fantasy_name || saving}>
          {t("common_save")}
        </Button>
      </div>
    </Modal>
  );
}
