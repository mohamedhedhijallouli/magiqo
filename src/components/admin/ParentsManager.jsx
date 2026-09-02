import React, { useState, useEffect } from "react";
import { Plus, Copy, Trash2, Ban, CheckCircle2, ShieldAlert, Pencil } from "lucide-react";
import { Parents, generateParentCode, subscribe, getAdminActiveLicenseCode } from "@/lib/db";
import { getActiveLicense } from "@/lib/auth";
import { isUnlimited } from "@/lib/license";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input, Label, Textarea, Select, Switch } from "@/components/ui/Field";
import { EmptyState, useConfirm, useToast, Badge } from "@/components/ui/Misc";

const FUNCTIONS = [
  { value: "parent", labelKey: "pm_function_parent" },
  { value: "teacher", labelKey: "pm_function_teacher" },
  { value: "professor", labelKey: "pm_function_professor" },
  { value: "guide", labelKey: "pm_function_guide" },
  { value: "other", labelKey: "pm_function_other" },
];

const EMPTY = { first_name: "", last_name: "", email: "", phone: "", age: "", gender: "", function: "parent", notes: "", language: "" };

export default function ParentsManager() {
  const { t, languages: allLanguages } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const [parents, setParents] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // tuteur en cours de modification/consultation, ou null pour "nouveau"
  const [form, setForm] = useState(EMPTY);

  // Quota V22 : Limite de tuteurs imposée par la licence active. Avant ce
  // correctif, ce panneau ne consultait jamais la licence et laissait créer
  // un nombre illimité de tuteurs.
  const activeLicense = getActiveLicense();
  const maxTutorsAllowed = activeLicense?.maxTutors ?? 2;
  const activeTutorsCount = parents.filter((p) => p.is_active).length;
  const isTutorLimitReached = !isUnlimited(maxTutorsAllowed) && activeTutorsCount >= maxTutorsAllowed;

  // V22 : chaque tuteur doit avoir une langue de travail parmi celles
  // incluses dans la licence active (une licence peut en couvrir plusieurs).
  const licenseLangCodes = (activeLicense?.languages || ["FR"]).map((l) => l.toLowerCase());
  const licenseLanguages = allLanguages.filter((l) => licenseLangCodes.includes(l.code.toLowerCase()));

  async function load() {
    setParents(await Parents.filter({ license_code: getAdminActiveLicenseCode() }, "-created_date"));
  }
  useEffect(() => {
    load();
    return subscribe((name) => name === "parents" && load());
  }, []);

  useEffect(() => {
    if (open && !editing && !form.language && licenseLanguages.length > 0) {
      setForm((f) => ({ ...f, language: licenseLanguages[0].code }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  // Le Maître du Jeu peut consulter ou modifier un tuteur déjà créé — avant
  // ce correctif, seules la suspension et la suppression étaient possibles.
  function openEdit(p) {
    setEditing(p);
    setForm({
      first_name: p.first_name || "", last_name: p.last_name || "", email: p.email || "",
      phone: p.phone || "", age: p.age || "", gender: p.gender || "", function: p.function || "parent",
      notes: p.notes || "", language: p.language || "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!editing && isTutorLimitReached) {
      toast(t("pm_limit_reached").replace("{max}", maxTutorsAllowed));
      return;
    }
    if (!form.language) {
      toast(t("pm_language_required"));
      return;
    }
    if (editing) {
      await Parents.update(editing.id, form);
    } else {
      await Parents.create({ ...form, parent_code: generateParentCode(), is_active: true, license_code: getAdminActiveLicenseCode() });
    }
    toast(t("common_saved"));
    setForm(EMPTY);
    setEditing(null);
    setOpen(false);
  }

  async function toggleActive(p) {
    if (!p.is_active && isTutorLimitReached) {
      toast(t("pm_limit_reached").replace("{max}", maxTutorsAllowed));
      return;
    }
    await Parents.update(p.id, { is_active: !p.is_active });
  }

  async function handleDelete(p) {
    const ok = await confirm({ title: t("confirm_delete_title"), message: t("confirm_delete_msg") });
    if (!ok) return;
    await Parents.remove(p.id);
    toast(t("common_deleted"));
  }

  function copyCode(code) {
    navigator.clipboard?.writeText(code);
    toast(t("common_copied"));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display text-xl text-parchment">{t("pm_title")}</h2>
          {activeLicense && (
            <p className={`text-xs mt-1 ${isTutorLimitReached ? "text-ember-bright" : "text-muted"}`}>
              {activeTutorsCount}/{isUnlimited(maxTutorsAllowed) ? t("lic_unlimited") : maxTutorsAllowed} {t("pm_tutors_used")}
            </p>
          )}
        </div>
        <Button size="sm" onClick={openNew} disabled={isTutorLimitReached}>
          <Plus size={16} /> {t("pm_new")}
        </Button>
      </div>

      {isTutorLimitReached && (
        <div className="mb-5 p-3 bg-ember/15 border border-ember/30 rounded-xl flex items-center gap-2 text-xs text-ember-bright">
          <ShieldAlert size={16} className="shrink-0" />
          <span>{t("pm_limit_reached").replace("{max}", maxTutorsAllowed)}</span>
        </div>
      )}

      {parents.length === 0 ? (
        <EmptyState icon="🧙" title={t("pm_empty")} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parents.map((p, i) => {
            const fn = FUNCTIONS.find((f) => f.value === p.function);
            return (
              <div key={p.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-pop-in bg-void-panel/60 border border-void-border rounded-2xl p-5 hover:-translate-y-0.5 transition-transform">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-display text-parchment">{p.first_name} {p.last_name}</p>
                    {p.email && <p className="text-xs text-muted">{p.email}</p>}
                    {p.phone && <p className="text-xs text-muted">{p.phone}</p>}
                  </div>
                  <Badge color={p.is_active ? "emerald" : "muted"}>{p.is_active ? t("common_active") : t("common_inactive")}</Badge>
                </div>
                {fn && <Badge color="arcane" className="mb-2">{t(fn.labelKey)}</Badge>}
                {p.language && (
                  <Badge color="gold" className="mb-2 ml-1.5">
                    {allLanguages.find((l) => l.code.toLowerCase() === p.language.toLowerCase())?.flag} {p.language.toUpperCase()}
                  </Badge>
                )}
                <button
                  onClick={() => copyCode(p.parent_code)}
                  className="w-full flex items-center justify-between gap-2 bg-void/50 border border-void-border rounded-xl px-3 py-2 mt-1 hover:border-gold-dim"
                >
                  <span className="font-rune text-gold-bright tracking-widest">{p.parent_code}</span>
                  <Copy size={13} className="text-muted" />
                </button>
                {p.notes && <p className="text-xs text-muted mt-2 italic line-clamp-2">{p.notes}</p>}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="ghost" className="flex-1" onClick={() => openEdit(p)}>
                    <Pencil size={14} /> {t("common_edit")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(p)}>
                    {p.is_active ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(p)}>
                    <Trash2 size={14} className="text-ember" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? t("pm_edit_title") : t("pm_new")}>
        {editing && (
          <div className="mb-4">
            <Label>{t("pm_code")}</Label>
            <button
              onClick={() => copyCode(editing.parent_code)}
              className="w-full flex items-center justify-between gap-2 bg-void/50 border border-void-border rounded-xl px-3 py-2 hover:border-gold-dim"
            >
              <span className="font-rune text-gold-bright tracking-widest">{editing.parent_code}</span>
              <Copy size={13} className="text-muted" />
            </button>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div>
            <Label>{t("pm_firstname")}</Label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <Label>{t("pm_lastname")}</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
          <div>
            <Label>{t("pm_email")} ({t("common_optional")})</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Téléphone ({t("common_optional")})</Label>
            <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+33 6 12 34 56 78" />
          </div>
          <div>
            <Label>{t("pm_age")} ({t("common_optional")})</Label>
            <Input type="number" min={0} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          </div>
          <div>
            <Label>{t("pm_gender")} ({t("common_optional")})</Label>
            <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">—</option>
              <option value="m">{t("pm_gender_m")}</option>
              <option value="f">{t("pm_gender_f")}</option>
              <option value="other">{t("pm_gender_other")}</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>{t("pm_function")}</Label>
            <Select value={form.function} onChange={(e) => setForm({ ...form, function: e.target.value })}>
              {FUNCTIONS.map((f) => (
                <option key={f.value} value={f.value}>{t(f.labelKey)}</option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>{t("pm_language")} *</Label>
            <Select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              <option value="">—</option>
              {licenseLanguages.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </Select>
            <p className="text-xs text-muted mt-1">{t("pm_language_hint")}</p>
          </div>
          <div className="sm:col-span-2">
            <Label>{t("pm_notes")}</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <p className="text-xs text-muted italic sm:col-span-2">{editing ? "" : t("pm_code_generated")}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => { setOpen(false); setEditing(null); }}>{t("common_cancel")}</Button>
          <Button onClick={handleSave} disabled={!form.first_name || !form.last_name || !form.language || (!editing && isTutorLimitReached)}>{t("common_save")}</Button>
        </div>
      </Modal>
    </div>
  );
}
