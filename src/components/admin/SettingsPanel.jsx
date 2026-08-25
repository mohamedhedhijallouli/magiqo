import React, { useEffect, useRef, useState } from "react";
import { KeyRound, Download, Upload, RefreshCcw, Sparkles, Database, CheckCircle2, AlertTriangle } from "lucide-react";
import { getAdminPassword, setAdminPassword, exportAllData, importAllData, resetGameData, getSetting, setSetting, getAdminActiveLicenseCode } from "@/lib/db";
import { clearAdminActiveLicenseCode } from "@/lib/auth";
import { supabaseEnabled } from "@/lib/supabaseClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useConfirm, useToast } from "@/components/ui/Misc";

export default function SettingsPanel() {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const [pwd, setPwd] = useState("");
  const [aiEndpoint, setAiEndpoint] = useState(() => getSetting("ai_vision_endpoint", ""));
  const fileRef = useRef(null);

  function saveAiEndpoint() {
    setSetting("ai_vision_endpoint", aiEndpoint.trim());
    toast(t("common_saved"));
  }

  function savePassword() {
    if (!pwd) return;
    setAdminPassword(pwd);
    setPwd("");
    toast(t("common_saved"));
  }

  async function exportData() {
    const dump = await exportAllData();
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `magiqo-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result);
        const ok = await confirm({ title: t("settings_import"), message: t("settings_import_confirm") });
        if (!ok) return;
        await importAllData(parsed);
        toast(t("settings_import_done"));
      } catch {
        toast(t("settings_import_error"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // Même comportement que la détection "nouveau Maître du Jeu" à la
  // connexion (conserve Types de parcours, Catégories d'objets, Types
  // d'animaux, Types de lieux) — sauf qu'ici, une fois la réinitialisation
  // effectuée, le système déconnecte et redemande explicitement un code de
  // licence avant de pouvoir continuer.
  async function handleReset() {
    const ok = await confirm({ title: t("settings_reset"), message: t("settings_reset_confirm") });
    if (!ok) return;
    await resetGameData();
    clearAdminActiveLicenseCode();
    localStorage.removeItem("magiqo:v1:admin_session");
    toast(t("settings_reset_done"));
    setTimeout(() => window.location.reload(), 600);
  }

  return (
    <div className="grid gap-5 max-w-xl">
      <h2 className="font-display text-xl text-parchment">{t("settings_title")}</h2>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><KeyRound size={16} />{t("settings_password")}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input type="password" placeholder="••••••••" value={pwd} onChange={(e) => setPwd(e.target.value)} />
            <Button onClick={savePassword} disabled={!pwd}>{t("common_save")}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("common_export")} / {t("common_import")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted mb-3">{t("settings_export_import_hint")}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={exportData}><Download size={15} />{t("settings_export")}</Button>
            <Button variant="ghost" onClick={() => fileRef.current?.click()}><Upload size={15} />{t("settings_import")}</Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importData} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database size={16} className="text-emerald" />{t("settings_database")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted mb-3">{t("settings_database_hint")}</p>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-void-border">
            <div className="flex items-center gap-2 text-xs">
              {supabaseEnabled ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald" />
                  <span>{t("settings_database_connected")}</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} className="text-ember-bright" />
                  <span>{t("settings_database_not_connected")}</span>
                </>
              )}
            </div>
            {getAdminActiveLicenseCode() && (
              <span className="font-rune text-[10px] text-gold-dim">{getAdminActiveLicenseCode()}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles size={16} className="text-arcane" />{t("settings_ai_vision")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted mb-3">{t("settings_ai_vision_hint")}</p>
          <div className="flex gap-3">
            <Input placeholder="https://votre-serveur.example.com/api/recognize" value={aiEndpoint} onChange={(e) => setAiEndpoint(e.target.value)} />
            <Button onClick={saveAiEndpoint}>{t("common_save")}</Button>
          </div>
          <p className="text-[11px] text-muted mt-2">{t("settings_ai_vision_note")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base text-ember-bright">{t("settings_reset")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted mb-3">{t("settings_reset_hint")}</p>
          <Button variant="danger" onClick={handleReset}><RefreshCcw size={15} />{t("settings_reset")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
