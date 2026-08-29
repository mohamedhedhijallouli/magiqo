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

const EMPTY = {
  question: "", type: "text", answer: "", choices: [], alt_answers: [],
  hint: "", difficulty: "", riddle_type: "", age_group: "apprenti", language: "",
  is_active: true, image_url: "",
};

export default function RiddleEditor({ open, onClose, riddle, riddleTypes }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const defaultLang = (getActiveLicense()?.languages?.[0] || "FR").toUpperCase();
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
      const payload = { ...form, alt_answers: (form.alt_answers || []).filter((a) => a.trim()) };
      if (riddle) await Riddles.update(riddle.id, { ...payload, license_code: riddle.license_code || getAdminActiveLicenseCode() });
      else await Riddles.create({ ...payload, license_code: getAdminActiveLicenseCode() });
      toast(t("common_saved"));
      onClose(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={() => onClose(false)} title={riddle ? t("rm_title_edit") : t("rm_title_new")} maxWidth="max-w-xl">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <LanguageIndicator value={form.language} onChange={(l) => set("language", l)} />
      </div>

      <div className="mb-4">
        <Label>{t("oe_riddle_question")}</Label>
        <Textarea value={form.question} onChange={(e) => set("question", e.target.value)} rows={2} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <div>
          <Label>{t("rm_type")}</Label>
          <Select value={form.riddle_type} onChange={(e) => set("riddle_type", e.target.value)}>
            <option value="">—</option>
            {riddleTypes.map((rt) => (
              <option key={rt.slug} value={rt.slug}>{rt.emoji} {taxonomyLabel(rt, t)}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t("rm_age_group")}</Label>
          <Select value={form.age_group} onChange={(e) => set("age_group", e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.emoji} {t(l.labelKey)} · {t(l.ageRangeKey)}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t("rm_difficulty")}</Label>
          <Select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
            <option value="">{t("rm_difficulty_none")}</option>
            <option value="easy">{t("rm_difficulty_easy")}</option>
            <option value="medium">{t("rm_difficulty_medium")}</option>
            <option value="hard">{t("rm_difficulty_hard")}</option>
          </Select>
        </div>
      </div>

      <div className="mb-4">
        <Label>{t("rm_hint")}</Label>
        <Textarea value={form.hint} onChange={(e) => set("hint", e.target.value)} rows={1} />
      </div>

      <div className="mb-4">
        <Label>{t("rm_reveal_photo")}</Label>
        <p className="text-xs text-muted mb-2">{t("rm_reveal_photo_hint")}</p>
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
        <button
          type="button"
          onClick={() => set("type", "text")}
          className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold border", form.type === "text" ? "border-arcane text-arcane bg-arcane/10" : "border-void-border text-muted")}
        >
          {t("riddle_answer_text")}
        </button>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, type: "choice", choices: f.choices?.length ? f.choices : ["", ""] }))}
          className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold border", form.type === "choice" ? "border-arcane text-arcane bg-arcane/10" : "border-void-border text-muted")}
        >
          {t("riddle_answer_choice")}
        </button>
      </div>

      {form.type === "choice" ? (
        <div className="flex flex-col gap-1.5 mb-4">
          {(form.choices || []).map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => set("answer", c)}
                className={cn(
                  "w-5 h-5 rounded-full border shrink-0 flex items-center justify-center",
                  form.answer === c && c !== "" ? "bg-emerald border-emerald" : "border-void-border"
                )}
              >
                {form.answer === c && c !== "" && <Check size={11} className="text-void" />}
              </button>
              <Input value={c} onChange={(e) => updateChoice(i, e.target.value)} placeholder={`${t("oe_riddle_answer")} ${i + 1}`} className="flex-1" />
              <button type="button" onClick={() => removeChoice(i)} className="text-muted hover:text-ember-bright">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={addChoice} className="self-start mt-1">
            <Plus size={12} /> {t("oe_riddle_answer")}
          </Button>
        </div>
      ) : (
        <div className="mb-4">
          <Label>{t("oe_riddle_answer")}</Label>
          <Input value={form.answer} onChange={(e) => set("answer", e.target.value)} />

          <div className="mt-3">
            <Label>{t("rm_alt_answers")}</Label>
            <div className="flex flex-col gap-1.5">
              {(form.alt_answers || []).map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={a} onChange={(e) => updateAltAnswer(i, e.target.value)} className="flex-1" />
                  <button type="button" onClick={() => removeAltAnswer(i)} className="text-muted hover:text-ember-bright">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={addAltAnswer} className="self-start mt-1">
                <Plus size={12} /> {t("rm_add_alt_answer")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <Label className="mb-0">{t("rm_is_active")}</Label>
        <Switch checked={form.is_active} onChange={(v) => set("is_active", v)} />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => onClose(false)}>{t("common_cancel")}</Button>
        <Button onClick={handleSave} disabled={!form.question.trim() || !form.answer.trim() || saving}>
          {t("common_save")}
        </Button>
      </div>
    </Modal>
  );
}
