import React, { useState } from "react";
import { Coins, RotateCcw, Save } from "lucide-react";
import { getPricingSettings, setPricingSettings, resetPricingSettings } from "@/lib/license";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Misc";

export default function PricingPanel() {
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState(getPricingSettings());

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    const cleaned = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Math.max(0, Number(v) || 0)]));
    const saved = setPricingSettings(cleaned);
    setForm(saved);
    toast(t("pricing_saved"));
  }

  function handleReset() {
    const defaults = resetPricingSettings();
    setForm(defaults);
    toast(t("pricing_saved"));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Coins size={16} /> {t("pricing_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted mb-5">{t("pricing_intro")}</p>

          <Label className="mb-2">{t("pricing_seasons_title")}</Label>
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <div>
              <Label className="text-xs">{t("pricing_basse")}</Label>
              <Input type="number" min={0} value={form.seasonBasse} onChange={(e) => set("seasonBasse", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{t("pricing_moyenne")}</Label>
              <Input type="number" min={0} value={form.seasonMoyenne} onChange={(e) => set("seasonMoyenne", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{t("pricing_haute")}</Label>
              <Input type="number" min={0} value={form.seasonHaute} onChange={(e) => set("seasonHaute", e.target.value)} />
            </div>
          </div>

          <Label className="mb-2">{t("pricing_units_title")}</Label>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div>
              <Label className="text-xs">{t("pricing_per_day")}</Label>
              <Input type="number" min={0} value={form.pricePerDay} onChange={(e) => set("pricePerDay", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{t("pricing_per_player")}</Label>
              <Input type="number" min={0} value={form.pricePerPlayer} onChange={(e) => set("pricePerPlayer", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{t("pricing_per_tutor")}</Label>
              <Input type="number" min={0} value={form.pricePerTutor} onChange={(e) => set("pricePerTutor", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{t("pricing_per_language")}</Label>
              <Input type="number" min={0} value={form.pricePerExtraLanguage} onChange={(e) => set("pricePerExtraLanguage", e.target.value)} />
            </div>
          </div>

          <Label className="mb-2">{t("pricing_forfait_title")}</Label>
          <p className="text-xs text-muted mb-2">{t("pricing_forfait_hint")}</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div>
              <Label className="text-xs">{t("pricing_forfait_price")}</Label>
              <Input type="number" min={0} value={form.forfaitPrice} onChange={(e) => set("forfaitPrice", e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              <Save size={15} /> {t("pricing_save")}
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw size={15} /> {t("pricing_reset")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
