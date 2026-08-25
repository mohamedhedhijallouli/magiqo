import React, { useState, useEffect, useMemo } from "react";
import { ShieldCheck, Sparkles, Copy, Ban, CheckCircle2, Trash2, Check, Pencil, Infinity as InfinityIcon } from "lucide-react";
import {
  generateLicense,
  getStoredLicenses,
  storeLicense,
  updateStoredLicense,
  setLicenseStatus,
  deleteLicenseById,
  revokeCode,
  getSecret,
  setSecret,
  calculateLicensePrice,
  ALL_LICENSE_LANGUAGES,
  UNLIMITED_SENTINEL,
  isUnlimited,
} from "@/lib/license";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { Badge, useConfirm, useToast } from "@/components/ui/Misc";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  licMethod: "hmac", licLength: 16, licDays: 30, licClient: "", licEmail: "",
  maxPlayers: 10, maxTutors: 2, selectedLanguages: ["FR"], licenseType: "standard",
};

export default function LicensesPanel() {
  const { t, languages: allLanguagesMeta } = useLanguage();
  const toast = useToast();
  const confirm = useConfirm();

  const [editingId, setEditingId] = useState(null); // id de la licence en cours de modification, ou null = nouvelle
  const [form, setForm] = useState(EMPTY_FORM);
  const { licMethod, licLength, licDays, licClient, licEmail, maxPlayers, maxTutors, selectedLanguages, licenseType } = form;

  const [licSecret, setLicSecretState] = useState(getSecret());
  const [licenses, setLicenses] = useState(getStoredLicenses());

  useEffect(() => setLicenses(getStoredLicenses()), []);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleLanguage(code) {
    setForm((f) => {
      const prev = f.selectedLanguages;
      if (prev.includes(code)) {
        const next = prev.filter((c) => c !== code);
        return { ...f, selectedLanguages: next.length > 0 ? next : prev }; // au moins 1 langue obligatoire
      }
      return { ...f, selectedLanguages: [...prev, code] };
    });
  }

  function setLicenseType(type) {
    setForm((f) => ({
      ...f,
      licenseType: type,
      // Forfaitaire : jours/joueurs/tuteurs deviennent illimités et non
      // modifiables (voir generateLicense qui les force de toute façon).
      licDays: type === "forfaitaire" ? 365 : (f.licDays === 365 ? 30 : f.licDays),
      maxPlayers: type === "forfaitaire" ? UNLIMITED_SENTINEL : (isUnlimited(f.maxPlayers) ? 10 : f.maxPlayers),
      maxTutors: type === "forfaitaire" ? UNLIMITED_SENTINEL : (isUnlimited(f.maxTutors) ? 2 : f.maxTutors),
    }));
  }

  // Calcul dynamique du tarif V22 en TND
  const pricing = useMemo(() => {
    return calculateLicensePrice({
      days: licDays,
      maxPlayers,
      maxTutors,
      languages: selectedLanguages,
      startDate: new Date(),
      licenseType,
    });
  }, [licDays, maxPlayers, maxTutors, selectedLanguages, licenseType]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(licEmail.trim());

  function startNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  // Le Maître des Maîtres peut modifier une licence déjà émise (langues,
  // nombre de joueurs/tuteurs, durée...). Comme les paramètres sont signés
  // dans le code lui-même, "modifier" génère en réalité un NOUVEAU code —
  // l'ancien est explicitement révoqué pour ne plus jamais fonctionner.
  function startEdit(l) {
    setEditingId(l.id);
    setForm({
      licMethod: l.method || "hmac",
      licLength: 16,
      licDays: l.days || 30,
      licClient: l.label || "",
      licEmail: l.email || "",
      maxPlayers: l.maxPlayers ?? 10,
      maxTutors: l.maxTutors ?? 2,
      selectedLanguages: l.languages || (l.language ? [l.language] : ["FR"]),
      licenseType: l.licenseType || "standard",
    });
  }

  async function handleGenerateLicense() {
    if (!isEmailValid) {
      toast(t("lic_email_required"));
      return;
    }
    const result = await generateLicense({
      length: Number(licLength),
      method: licMethod,
      days: Number(licDays),
      label: licClient.trim(),
      email: licEmail.trim(),
      maxPlayers: Number(maxPlayers),
      maxTutors: Number(maxTutors),
      languages: selectedLanguages,
      startDate: new Date(),
      licenseType,
    });

    if (editingId) {
      const previous = licenses.find((l) => l.id === editingId);
      if (previous && previous.code !== result.code) revokeCode(previous.code);
      updateStoredLicense(editingId, result);
      toast(t("lic_updated"));
    } else {
      storeLicense(result);
      toast(t("common_saved"));
    }

    setLicenses(getStoredLicenses());
    startNew();
  }

  function saveSecret() {
    setSecret(licSecret);
    toast(t("common_saved"));
  }

  function copyCode(code) {
    navigator.clipboard?.writeText(code);
    toast(t("common_copied"));
  }

  function toggleStatus(l) {
    setLicenseStatus(l.id, l.status === "active" ? "suspended" : "active");
    setLicenses(getStoredLicenses());
  }

  async function handleDelete(l) {
    const ok = await confirm({ title: t("lic_delete"), message: t("lic_delete_confirm") });
    if (!ok) return;
    deleteLicenseById(l.id);
    setLicenses(getStoredLicenses());
    toast(t("common_deleted"));
  }

  function langMeta(code) {
    return allLanguagesMeta.find((l) => l.code.toLowerCase() === code.toLowerCase());
  }

  const isForfait = licenseType === "forfaitaire";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck size={16} />{t("lic_title")} (V22)
            </CardTitle>
            <span className="text-xs font-semibold px-2.5 py-1 bg-void/60 border border-gold-dim/30 rounded-full text-gold-bright">
              {pricing.seasonInfo.label} ({pricing.seasonInfo.basePrice} TND)
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {editingId && (
            <div className="mb-4 p-2.5 bg-arcane/10 border border-arcane/30 rounded-xl flex items-center justify-between gap-2 text-xs text-arcane">
              <span>{t("lic_editing_notice")}</span>
              <button onClick={startNew} className="underline shrink-0">{t("common_cancel")}</button>
            </div>
          )}

          <p className="text-xs text-muted mb-4 flex items-start gap-1.5">
            <Sparkles size={12} className="text-arcane shrink-0 mt-0.5" /> {t("lic_secret_note")}
          </p>

          {/* Type de licence */}
          <div className="mb-4">
            <Label>{t("lic_type")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLicenseType("standard")}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 rounded-xl border text-sm transition-colors",
                  !isForfait ? "bg-gold/15 border-gold-dim text-gold-bright" : "bg-void/40 border-void-border text-muted hover:border-white/25"
                )}
              >
                {t("lic_type_standard")}
              </button>
              <button
                type="button"
                onClick={() => setLicenseType("forfaitaire")}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 rounded-xl border text-sm transition-colors",
                  isForfait ? "bg-gold/15 border-gold-dim text-gold-bright" : "bg-void/40 border-void-border text-muted hover:border-white/25"
                )}
              >
                <span className="flex items-center gap-1"><InfinityIcon size={13} /> {t("lic_type_forfait")}</span>
              </button>
            </div>
            {isForfait && <p className="text-xs text-muted mt-1.5">{t("lic_type_forfait_hint")}</p>}
          </div>

          {/* Configuration Technique */}
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div>
              <Label>{t("lic_method")}</Label>
              <Select value={licMethod} onChange={(e) => set("licMethod", e.target.value)}>
                <option value="hmac">HMAC-SHA256</option>
                <option value="checksum">Checksum</option>
              </Select>
            </div>
            <div>
              <Label>{t("lic_length")}</Label>
              <Select value={licLength} onChange={(e) => set("licLength", e.target.value)}>
                <option value="12">12</option>
                <option value="16">16</option>
                <option value="20">20</option>
                <option value="24">24</option>
              </Select>
            </div>
            <div>
              <Label>{t("lic_days")}</Label>
              <Input type="number" min={1} value={licDays} disabled={isForfait} onChange={(e) => set("licDays", e.target.value)} />
            </div>
          </div>

          {/* Client & Binding */}
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div>
              <Label>{t("lic_client")}</Label>
              <Input value={licClient} onChange={(e) => set("licClient", e.target.value)} placeholder="Client SARL" />
            </div>
            <div>
              <Label>{t("lic_bind_email")} *</Label>
              <Input type="email" required value={licEmail} onChange={(e) => set("licEmail", e.target.value)} placeholder="client@exemple.com" />
            </div>
          </div>

          {/* Paramètres V22 : Joueurs, Tuteurs */}
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div>
              <Label>{t("lic_max_players")}</Label>
              <Input type="number" min={1} value={isForfait ? "" : maxPlayers} disabled={isForfait} placeholder={isForfait ? t("lic_unlimited") : ""} onChange={(e) => set("maxPlayers", e.target.value)} />
            </div>
            <div>
              <Label>{t("lic_max_tutors")}</Label>
              <Input type="number" min={1} value={isForfait ? "" : maxTutors} disabled={isForfait} placeholder={isForfait ? t("lic_unlimited") : ""} onChange={(e) => set("maxTutors", e.target.value)} />
            </div>
          </div>

          {/* Langues de la licence (V22 : 1 ou plusieurs, la 1ère gratuite) */}
          <div className="mb-4">
            <Label>{t("lic_languages")}</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_LICENSE_LANGUAGES.map((code) => {
                const meta = langMeta(code);
                const active = selectedLanguages.includes(code);
                return (
                  <button
                    type="button"
                    key={code}
                    onClick={() => toggleLanguage(code)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm transition-colors",
                      active
                        ? "bg-gold/15 border-gold-dim text-gold-bright"
                        : "bg-void/40 border-void-border text-muted hover:border-white/25"
                    )}
                  >
                    {active && <Check size={13} />}
                    <span>{meta?.flag}</span>
                    {meta?.label || code}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted mt-1.5">{t("lic_languages_hint")}</p>
          </div>

          {/* Bloc de Calcul du Tarif en TND */}
          <div className="p-3 bg-void/50 border border-white/10 rounded-xl mb-4 space-y-1 text-xs text-muted">
            {isForfait ? (
              <div className="flex justify-between"><span>{t("lic_type_forfait")} :</span><span>{pricing.pricing.forfaitPrice} TND</span></div>
            ) : (
              <>
                <div className="flex justify-between"><span>{t("lic_price_season")} ({pricing.seasonInfo.label}) :</span><span>{pricing.seasonInfo.basePrice} TND</span></div>
                <div className="flex justify-between"><span>{t("lic_price_days")} ({licDays} {t("lic_days_unit")}) :</span><span>+ {(licDays || 0) * pricing.pricing.pricePerDay} TND</span></div>
                <div className="flex justify-between"><span>{t("lic_price_players")} ({maxPlayers} max) :</span><span>+ {(maxPlayers || 0) * pricing.pricing.pricePerPlayer} TND</span></div>
                <div className="flex justify-between"><span>{t("lic_price_tutors")} ({maxTutors} max) :</span><span>+ {(maxTutors || 0) * pricing.pricing.pricePerTutor} TND</span></div>
              </>
            )}
            <div className="flex justify-between">
              <span>{t("lic_price_languages")} ({pricing.langCount}, {pricing.extraLanguages} {t("lic_price_languages_extra")}) :</span>
              <span>+ {pricing.languagesPrice} TND</span>
            </div>
            <div className="flex justify-between font-bold text-gold-bright border-t border-white/10 pt-1.5 mt-1 text-sm">
              <span>{t("lic_price_total")} :</span>
              <span>{pricing.totalPriceTND} TND</span>
            </div>
          </div>

          <Button onClick={handleGenerateLicense} disabled={!isEmailValid} className="w-full mb-4">
            {editingId ? <Pencil size={15} /> : <Sparkles size={15} />}
            {editingId ? t("lic_save_changes") : t("lic_generate")} ({pricing.totalPriceTND} TND)
          </Button>

          {/* Clé secrète */}
          <div className="mb-4">
            <Label>{t("lic_secret")}</Label>
            <div className="flex gap-3">
              <Input type="password" value={licSecret} onChange={(e) => setLicSecretState(e.target.value)} />
              <Button variant="ghost" onClick={saveSecret}>{t("common_save")}</Button>
            </div>
          </div>

          {/* Historique des licences */}
          {licenses.length > 0 && (
            <div>
              <Label>{t("lic_history")}</Label>
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                {licenses.map((l) => {
                  const langs = l.languages || (l.language ? [l.language] : ["FR"]);
                  const players = isUnlimited(l.maxPlayers) ? t("lic_unlimited") : l.maxPlayers ?? "N/A";
                  const tutors = isUnlimited(l.maxTutors) ? t("lic_unlimited") : l.maxTutors ?? "N/A";
                  return (
                    <div key={l.id} className="bg-void/40 border border-void-border rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <button onClick={() => copyCode(l.code)} className="flex items-center gap-1.5 font-rune text-gold-bright text-sm tracking-widest hover:text-gold-bright/80">
                          {l.code} <Copy size={12} />
                        </button>
                        <div className="flex items-center gap-1.5">
                          {l.licenseType === "forfaitaire" && <Badge color="arcane"><InfinityIcon size={11} /> {t("lic_type_forfait")}</Badge>}
                          <Badge color={l.status === "active" ? "emerald" : "ember"}>
                            {l.status === "active" ? t("lic_active") : t("lic_suspended")}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted mb-1">
                        <span>{l.label || t("lic_client_none")}</span>
                        <span>{t("lic_expires")} {new Date(l.expiresAt).toLocaleDateString()}</span>
                      </div>
                      {l.email && (
                        <p className="text-xs text-arcane mb-1">✉️ {l.email}</p>
                      )}

                      {/* Meta V22 */}
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted border-t border-white/5 pt-1.5">
                        <span>{t("lic_languages")}: <strong className="text-parchment">{langs.join(", ")}</strong></span>
                        <span>• {t("lic_max_players")}: <strong className="text-parchment">{players}</strong></span>
                        <span>• {t("lic_max_tutors")}: <strong className="text-parchment">{tutors}</strong></span>
                        {l.priceTND && <span className="text-gold-bright font-bold">• {l.priceTND} TND</span>}
                      </div>

                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(l)}>
                          <Pencil size={13} /> {t("common_edit")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleStatus(l)}>
                          {l.status === "active" ? <Ban size={13} /> : <CheckCircle2 size={13} />}
                          {l.status === "active" ? t("lic_suspend") : t("lic_activate")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(l)}>
                          <Trash2 size={13} className="text-ember" /> {t("lic_delete")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}