import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Ban, CheckCircle2, Download } from "lucide-react";
import { Riddles, RiddleTypes, subscribe, getAdminActiveLicenseCode } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import { taxonomyLabel, cn } from "@/lib/utils";
import { LEVELS } from "@/lib/gameData";
import { LANGUAGES } from "@/lib/i18n";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Badge, EmptyState, useConfirm, useToast } from "@/components/ui/Misc";
import RiddleEditor from "@/components/admin/RiddleEditor";
import RiddleImportPanel from "@/components/admin/RiddleImportPanel";

export default function RiddlesManager() {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const [riddles, setRiddles] = useState([]);
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [riddleType, setRiddleType] = useState("");
  const [language, setLanguage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  async function load() {
    const license_code = getAdminActiveLicenseCode();
    setRiddles(await Riddles.filter({ license_code }, "-created_date"));
    setTypes(await RiddleTypes.filter({ license_code }, "label"));
  }
  useEffect(() => {
    load();
    return subscribe((name) => (name === "riddles" || name === "riddle_types") && load());
  }, []);

  const filtered = useMemo(() => {
    return riddles.filter((r) => {
      const matchesSearch = !search || r.question?.toLowerCase().includes(search.toLowerCase()) || r.answer?.toLowerCase().includes(search.toLowerCase());
      const matchesAge = !ageGroup || r.age_group === ageGroup;
      const matchesType = !riddleType || r.riddle_type === riddleType;
      const matchesLang = !language || (r.language || "").toUpperCase() === language.toUpperCase();
      const matchesStatus = !statusFilter || (statusFilter === "active" ? r.is_active : !r.is_active);
      return matchesSearch && matchesAge && matchesType && matchesLang && matchesStatus;
    });
  }, [riddles, search, ageGroup, riddleType, language, statusFilter]);

  async function handleDelete(r) {
    const ok = await confirm({ title: t("confirm_delete_title"), message: t("confirm_delete_msg") });
    if (!ok) return;
    await Riddles.remove(r.id);
    toast(t("common_deleted"));
  }

  async function toggleActive(r) {
    await Riddles.update(r.id, { is_active: !r.is_active });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
        <h2 className="font-display text-xl text-parchment">{t("rm_title")}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setImportOpen(true)}>
            <Download size={16} /> {t("rim_open_btn")}
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setEditorOpen(true); }}>
            <Plus size={16} /> {t("rm_new")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input className="pl-9 rtl:pl-4 rtl:pr-9" placeholder={t("rm_search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-2 mb-6">
        <Select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
          <option value="">{t("rm_filter_age_all")}</option>
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>{l.emoji} {t(l.labelKey)}</option>
          ))}
        </Select>
        <Select value={riddleType} onChange={(e) => setRiddleType(e.target.value)}>
          <option value="">{t("rm_filter_type_all")}</option>
          {types.map((rt) => (
            <option key={rt.slug} value={rt.slug}>{rt.emoji} {taxonomyLabel(rt, t)}</option>
          ))}
        </Select>
        <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">{t("rm_filter_lang_all")}</option>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code.toUpperCase()}>{l.flag} {l.label}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{t("rm_filter_status_all")}</option>
          <option value="active">{t("common_active")}</option>
          <option value="inactive">{t("common_inactive")}</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="❓" title={t("rm_empty")} />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((r, i) => {
            const level = LEVELS.find((l) => l.value === r.age_group);
            const typeInfo = types.find((rt) => rt.slug === r.riddle_type);
            const langInfo = LANGUAGES.find((l) => l.code.toUpperCase() === (r.language || "").toUpperCase());
            return (
              <div
                key={r.id}
                style={{ animationDelay: `${i * 30}ms` }}
                className={cn(
                  "animate-pop-in bg-void-panel/60 border border-void-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3",
                  !r.is_active && "opacity-60"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-parchment truncate">{r.question}</p>
                  <p className="text-xs text-muted truncate">
                    {t("oe_riddle_answer")}: {r.answer}
                    {r.alt_answers?.length > 0 && ` (+${r.alt_answers.length})`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {level && <Badge color={level.color}>{level.emoji} {t(level.labelKey)}</Badge>}
                  {typeInfo && <Badge color="arcane">{typeInfo.emoji} {taxonomyLabel(typeInfo, t)}</Badge>}
                  {langInfo && <Badge color="muted">{langInfo.flag} {langInfo.label}</Badge>}
                  <Badge color={r.type === "choice" ? "gold" : "muted"}>
                    {r.type === "choice" ? t("riddle_answer_choice") : t("riddle_answer_text")}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(r)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-parchment" title={r.is_active ? t("common_active") : t("common_inactive")}>
                    {r.is_active ? <CheckCircle2 size={16} className="text-emerald-bright" /> : <Ban size={16} />}
                  </button>
                  <button onClick={() => { setEditing(r); setEditorOpen(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-parchment">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(r)} className="p-1.5 rounded-lg hover:bg-ember/10 text-muted hover:text-ember-bright">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RiddleEditor
        open={editorOpen}
        onClose={(changed) => { setEditorOpen(false); if (changed) load(); }}
        riddle={editing}
        riddleTypes={types}
      />

      <RiddleImportPanel
        open={importOpen}
        onClose={(changed) => { setImportOpen(false); if (changed) load(); }}
        existingRiddles={riddles}
        riddleTypes={types}
      />
    </div>
  );
}
