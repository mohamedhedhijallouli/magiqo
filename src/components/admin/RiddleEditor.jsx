import React, { useState, useEffect } from "react";
import { Plus, Trash2, Check, Upload, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Input, Label, Textarea, Select, Switch } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";
import { Riddles, getAdminActiveLicenseCode, fileToDataUrl } from "@/lib/db";
import { getActiveLicense } from "@/lib/auth";
import { useToast } from "@/components/ui/Misc";
import { taxonomyLabel, cn } from "@/lib/utils";
import { LEVELS } from "@/lib/gameData";
import LanguageIndicator from "@/components/shared/LanguageIndicator";

// Préréglages de difficulté (cahier des charges) : sélectionner un niveau
// pré-remplit les trois champs de timing/pénalité ci-dessous, qui restent
// ensuite librement modifiables (le préréglage n'est qu'un point de départ,
// pas une contrainte figée).
const DIFFICULTY_PRESETS = {
  facile: { time_limit_seconds: 20, wrong_penalty_seconds: 10, hint_penalty_seconds: 10 },
  moyen: { time_limit_seconds: 40, wrong_penalty_seconds: 20, hint_penalty_seconds: 20 },
  difficile: { time_limit_seconds: 60, wrong_penalty_seconds: 30, hint_penalty_seconds: 30 },
  complexe: { time_limit_seconds: 120, wrong_penalty_seconds: 45, hint_penalty_seconds: 45 },
};

const EMPTY = {
  question: "", type: "text", answer: "", choices: [], alt_answers: [],
  hint: "", riddle_type: "", age_group: "apprenti", language: "",
  is_active: true, image_url: "",
  difficulty_level: "", time_limit_seconds: 0, wrong_penalty_seconds: 15, hint_penalty_seconds: 15,
};

export default function RiddleEditor({ open, onClose, riddle, riddleTypes }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const activeLicense = getActiveLicense();
  const defaultLang = (activeLicense?.languages?.[0] || "FR").toUpperCase();

  useEffect(() => {
    if (open) {
      setForm(
        riddle
          ? { ...EMPTY, ...riddle }
          : { ...EMPTY, language: defaultLang, riddle_type: riddleTypes[0]?.slug || "" }
      );
    }
  }, [open, riddle, riddleTypes]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function applyDifficultyPreset(level) {
    const preset = DIFFICULTY_PRESETS[level];
    setForm((f) => ({ ...f, difficulty_level: level, ...(preset || {}) }));
  }

  function updateChoice(index, value) {
    const choices = [...(form.choices || [])];
    choices[index] = value;
    set("choices", choices);
  }
  function addChoice() {
    set("choices", [...(form.choices || []), ""]);
  }
  function removeChoice(index) {
    set("choices", (form.choices || []).filter((_, i) => i !== index));
  }

  function updateAltAnswer(index, value) {
    const alts = [...(form.alt_answers || [])];
    alts[index] = value;
    set("alt_answers", alts);
  }
  function addAltAnswer() {
    set("alt_answers", [...(form.alt_answers || []), ""]);
  }
  function removeAltAnswer(index) {
    set("alt_answers", (form.alt_answers || []).filter((_, i) => i !== index));
  }

  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    set("image_url", await fileToDataUrl(file));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form };
      if (riddle) {
        await Riddles.update(riddle.id, { ...payload, license_code: riddle.license_code || getAdminActiveLicenseCode() });
      } else {
        await Riddles.create({ ...payload, license_code: getAdminActiveLicenseCode() });
      }
      toast(t("common_saved"));
      onClose(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={() => onClose(false)} title={riddle ? t("rm_edit") : t("rm_new")}>
      <div className="mb-4">
        <Label>{t("rm_question")}</Label>
        <Textarea value={form.question} onChange={(e) => set("question", e.target.value)} rows={2} />
      </div>

      <div className="mb-4">
        <Label>{t("rm_image")}</Label>
        <div className="flex items-center gap-3">
          {form.image_url && (
            <div className="relative">
              <img src={form.image_url} alt="" className="w-14 h-14 rounded-lg object-cover border border-void-border" />
              <button
                type="button"
                onClick={() => set("image_url", "")}
                className="absolute -top-1.5 -right-1.5 bg-void border border-void-border rounded-full p-0.5 text-muted hover:text-ember-bright"
              >
                <X size={11} />
              </button>
            </div>
          )}
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-void-border hover:border-gold-dim text-sm">
              <Upload size={14} /> {t("oe_upload_image")}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {["text", "choice"].map((ty) => (
          <button
            key={ty}
            type="button"
            onClick={() => set("type", ty)}
            className={cn(
              "px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-colors",
              form.type === ty ? "border-arcane bg-arcane/15 text-parchment" : "border-void-border text-muted"
            )}
          >
            {ty === "text" ? t("rm_type_text") : t("rm_type_choice")}
          </button>
        ))}
      </div>

      {form.type === "choice" ? (
        <div className="mb-4">
          <Label>{t("rm_choices")}</Label>
          <div className="flex flex-col gap-2">
            {(form.choices || []).map((c, i) => (
              <div key={i} className="flex gap-2">
                <Input value={c} onChange={(e) => updateChoice(i, e.target.value)} placeholder={`${t("rm_choice")} ${i + 1}`} />
                <button onClick={() => removeChoice(i)} className="text-muted hover:text-ember-bright"><X size={16} /></button>
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={addChoice}><Plus size={13} /> {t("common_add")}</Button>
          <div className="mt-3">
            <Label>{t("rm_correct_answer")}</Label>
            <Select value={form.answer} onChange={(e) => set("answer", e.target.value)}>
              <option value="">{t("rm_pick_correct")}</option>
              {(form.choices || []).filter(Boolean).map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </Select>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Label>{t("rm_answer")}</Label>
            <Input value={form.answer} onChange={(e) => set("answer", e.target.value)} />
          </div>
          <div className="mb-4">
            <Label>{t("rm_alt_answers")}</Label>
            <div className="flex flex-col gap-2">
              {(form.alt_answers || []).map((a, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={a} onChange={(e) => updateAltAnswer(i, e.target.value)} />
                  <button onClick={() => removeAltAnswer(i)} className="text-muted hover:text-ember-bright"><X size={16} /></button>
                </div>
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={addAltAnswer}><Plus size={13} /> {t("rm_add_alt_answer")}</Button>
          </div>
        </>
      )}

      <div className="mb-4">
        <Label>{t("rm_hint")}</Label>
        <Textarea value={form.hint} onChange={(e) => set("hint", e.target.value)} rows={1} />
      </div>

      <div className="mb-4 p-4 rounded-xl border border-void-border bg-white/[0.02]">
        <Label>{t("rm_difficulty_level")}</Label>
        <p className="text-xs text-muted mb-2">{t("rm_difficulty_level_hint")}</p>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {Object.keys(DIFFICULTY_PRESETS).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => applyDifficultyPreset(lvl)}
              className={cn(
                "px-2 py-2 rounded-lg border-2 text-xs font-semibold transition-colors",
                form.difficulty_level === lvl ? "border-arcane bg-arcane/15 text-parchment" : "border-void-border text-muted"
              )}
            >
              {t(`rm_difficulty_${lvl}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">{t("rm_time_limit_seconds")}</Label>
            <Input type="number" min={0} value={form.time_limit_seconds} onChange={(e) => set("time_limit_seconds", Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label className="text-xs">{t("rm_wrong_penalty_seconds")}</Label>
            <Input type="number" min={0} value={form.wrong_penalty_seconds} onChange={(e) => set("wrong_penalty_seconds", Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label className="text-xs">{t("rm_hint_penalty_seconds")}</Label>
            <Input type="number" min={0} value={form.hint_penalty_seconds} onChange={(e) => set("hint_penalty_seconds", Number(e.target.value) || 0)} />
          </div>
        </div>
        <p className="text-[11px] text-muted mt-2">{t("rm_zero_unlimited_hint")}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <Label>{t("rm_riddle_type")}</Label>
          <Select value={form.riddle_type} onChange={(e) => set("riddle_type", e.target.value)}>
            {riddleTypes.map((rt) => (
              <option key={rt.slug} value={rt.slug}>{rt.emoji} {taxonomyLabel(rt, t)}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t("rm_age_group")}</Label>
          <Select value={form.age_group} onChange={(e) => set("age_group", e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.emoji} {t(l.labelKey)}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mb-4">
        <LanguageIndicator language={form.language} onChange={(v) => set("language", v)} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <Label className="mb-0">{t("rm_active")}</Label>
        <Switch checked={form.is_active} onChange={(v) => set("is_active", v)} />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => onClose(false)}>{t("common_cancel")}</Button>
        <Button onClick={handleSave} disabled={!form.question || !form.answer || saving}>
          {t("common_save")}
        </Button>
      </div>
    </Modal>
  );
}
