import React, { useState, useEffect, useMemo } from "react";
import QRCode from "qrcode";
import { Dice5, Upload, Wand2, Sparkles, Download, X, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Input, Label, Textarea, Select, Switch } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";
import { Places, fileToDataUrl, generatePlaceCode, getAdminActiveLicenseCode } from "@/lib/db";
import { getActiveLicense } from "@/lib/auth";
import { useToast } from "@/components/ui/Misc";
import { generatePlaceContent, randomPlaceRealName } from "@/lib/aiGenerator";
import { taxonomyLabel } from "@/lib/utils";
import LevelContentEditor from "@/components/shared/LevelContentEditor";
import LanguageIndicator from "@/components/shared/LanguageIndicator";

const EMPTY = {
  real_name: "", magic_name: "", gaming_name: "", is_adult_content: false,
  emoji: "🏛️", color: "#8B7BF0", description: "", image_url: "",
  place_type: "", is_active: true, lat: "", lng: "", city: "", country: "", region: "", language: "",
  parent_place_id: "",
  enigma_explorateur: "", enigma_apprenti: "", enigma_aventurier: "", enigma_expert: "",
  hint_explorateur: "", hint_apprenti: "", hint_aventurier: "", hint_expert: "",
  mission_explorateur: "", mission_apprenti: "", mission_aventurier: "", mission_expert: "",
};

export default function PlaceEditor({ open, onClose, place, placeTypes, places, existingCodes }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [gpsQrUrl, setGpsQrUrl] = useState("");
  const [parentSearch, setParentSearch] = useState("");
  const [parentSearchOpen, setParentSearchOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const defaultLang = (getActiveLicense()?.languages?.[0] || "FR").toUpperCase();
      const initialForm = place ? { ...EMPTY, ...place } : { ...EMPTY, language: defaultLang, code: generatePlaceCode(existingCodes) };
      // S'assurer que place_type est en minuscules pour matcher les slugs des PlaceTypes
      if (initialForm.place_type) {
        initialForm.place_type = initialForm.place_type.toLowerCase();
      }
      setForm(initialForm);
    }
    setParentSearch("");
  }, [open, place, existingCodes]);

  useEffect(() => {
    if (form.code) {
      QRCode.toDataURL(form.code, { width: 220, margin: 1, color: { dark: "#181233", light: "#F3EAD8" } }).then(setQrUrl);
    }
  }, [form.code]);

  useEffect(() => {
    if (form.lat !== "" && form.lng !== "" && form.lat != null && form.lng != null) {
      const geoUri = `geo:${form.lat},${form.lng}?q=${form.lat},${form.lng}`;
      QRCode.toDataURL(geoUri, { width: 220, margin: 1, color: { dark: "#211A42", light: "#F3EAD8" } }).then(setGpsQrUrl);
    } else {
      setGpsQrUrl("");
    }
  }, [form.lat, form.lng]);

  // Candidats éligibles pour être "Lieu parent"
  //
  // Correctif : la recherche filtrait auparavant les candidats aux seuls
  // lieux dont le TYPE avait l'option "allows_elements" activée (par
  // défaut seuls "Site archéologique" et "Château fort"). Résultat : pour
  // la quasi-totalité des lieux (Musée, Site naturel, Autre lieu, etc.),
  // la recherche ne renvoyait jamais aucun résultat, sans aucun message —
  // ce qui donnait l'impression que le champ ne fonctionnait pas du tout.
  // On autorise désormais n'importe quel autre lieu existant comme parent.
  const parentCandidates = useMemo(() => {
    const pool = places.filter((p) => !(place && p.id === place.id));

    const q = parentSearch.trim().toLowerCase();
    if (!q) return pool;

    return pool.filter((p) => {
      const real = (p.real_name || "").toLowerCase();
      const magic = (p.magic_name || "").toLowerCase();
      const country = (p.country || "").toLowerCase();
      const city = (p.city || "").toLowerCase();
      return real.includes(q) || magic.includes(q) || country.includes(q) || city.includes(q);
    });
  }, [places, place, parentSearch]);

  const selectedParent = useMemo(() => places.find((p) => p.id === form.parent_place_id), [places, form.parent_place_id]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Voir ObjectEditor : le générateur local ne sait écrire qu'en français.
  const isFrench = (form.language || "FR").toUpperCase() === "FR";

  function applyGenerated(realName) {
    const generated = generatePlaceContent(realName);
    setForm((f) => ({ ...f, real_name: realName, magic_name: generated.fantasy_name, ...generated }));
  }

  function handleRandomPlace() {
    applyGenerated(randomPlaceRealName());
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

  function downloadQr() {
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `magiqo-lieu-${form.code}.png`;
    a.click();
  }

  function downloadGpsQr() {
    const a = document.createElement("a");
    a.href = gpsQrUrl;
    a.download = `magiqo-lieu-${form.code}-gps.png`;
    a.click();
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        place_type: (form.place_type || "autre").toLowerCase(),
        lat: form.lat === "" ? null : Number(form.lat),
        lng: form.lng === "" ? null : Number(form.lng),
      };
      if (place) await Places.update(place.id, { ...payload, license_code: place.license_code || getAdminActiveLicenseCode() });
      else await Places.create({ ...payload, license_code: getAdminActiveLicenseCode() });
      toast(t("common_saved"));
      onClose(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={() => onClose(false)} title={place ? t("common_edit") : t("pl_new")} maxWidth="max-w-2xl">
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <Button type="button" variant="arcane" size="sm" onClick={handleRandomPlace} disabled={!!place || !isFrench}>
          <Dice5 size={15} /> {t("pl_random")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleAutofill} disabled={!form.real_name.trim() || !isFrench}>
          <Wand2 size={15} /> {t("pl_autofill")}
        </Button>
        <LanguageIndicator value={form.language} onChange={(l) => set("language", l)} />
      </div>
      {!isFrench && (
        <p className="text-xs text-ember-bright/90 mb-3">{t("autofill_language_note")}</p>
      )}
      <p className="text-xs text-muted flex items-center gap-1.5 mb-5">
        <Sparkles size={12} className="text-arcane shrink-0" /> {t("pl_ai_note")}
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <Label>{t("pl_real_name")}</Label>
          <Input value={form.real_name} onChange={(e) => set("real_name", e.target.value)} />
        </div>
        <div>
          <Label>{t("pl_magic_name")}</Label>
          <Input value={form.magic_name} onChange={(e) => set("magic_name", e.target.value)} />
        </div>
        <div>
          <Label>{t("pl_type")}</Label>
          <Select value={form.place_type} onChange={(e) => set("place_type", e.target.value)}>
            <option value="">—</option>
            {placeTypes.map((pt) => (
              <option key={pt.slug} value={pt.slug.toLowerCase()}>
                {pt.emoji} {taxonomyLabel(pt, t)}
              </option>
            ))}
          </Select>
        </div>

        <div className="relative">
          <Label>{t("pl_parent_site")}</Label>
          {selectedParent ? (
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-void-panel2 border-2 border-void-border">
              <span className="text-sm text-parchment truncate">{selectedParent.magic_name || selectedParent.real_name}</span>
              <button onClick={() => set("parent_place_id", "")} className="text-muted hover:text-ember-bright shrink-0">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search size={14} className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                className="pl-8 rtl:pl-4 rtl:pr-8"
                placeholder={t("pl_parent_search") || "Rechercher un lieu parent..."}
                value={parentSearch}
                onChange={(e) => setParentSearch(e.target.value)}
                onFocus={() => setParentSearchOpen(true)}
                onBlur={() => setTimeout(() => setParentSearchOpen(false), 200)}
              />
              {parentSearchOpen && (
                <div className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto bg-void-panel border border-void-border rounded-xl shadow-glow">
                  {parentCandidates.length > 0 ? (
                    parentCandidates.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => {
                          set("parent_place_id", p.id);
                          setParentSearch("");
                          setParentSearchOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-parchment hover:bg-white/5 flex justify-between items-center"
                      >
                        <span className="truncate">{p.magic_name || p.real_name}</span>
                        {p.country && <span className="text-xs text-muted shrink-0 ml-2">{p.country}</span>}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs text-muted italic">
                      {places.length <= 1 ? t("pl_parent_no_other") || "Aucun autre lieu créé pour l'instant." : t("pl_parent_no_match") || "Aucun lieu trouvé."}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-muted mt-1">{t("pl_parent_none")}</p>
        </div>

        <div>
          <Label>{t("pl_lat")}</Label>
          <Input type="number" step="any" value={form.lat} onChange={(e) => set("lat", e.target.value)} />
        </div>
        <div>
          <Label>{t("pl_lng")}</Label>
          <Input type="number" step="any" value={form.lng} onChange={(e) => set("lng", e.target.value)} />
        </div>
        <div>
          <Label>{t("pl_city")}</Label>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div>
          <Label>{t("pl_country")}</Label>
          <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
        </div>
        <div>
          <Label>{t("pl_region")}</Label>
          <Input value={form.region} onChange={(e) => set("region", e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 bg-void/40 border border-void-border rounded-xl p-3">
        <Label className="mb-0">{t("pl_adult_content")}</Label>
        <Switch checked={form.is_adult_content} onChange={(v) => set("is_adult_content", v)} />
      </div>
      {form.is_adult_content && (
        <div className="mb-4">
          <Label>{t("pl_gaming_name")}</Label>
          <Input value={form.gaming_name} onChange={(e) => set("gaming_name", e.target.value)} />
        </div>
      )}

      <div className="mb-4">
        <Label>{t("oe_description")}</Label>
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
      </div>

      <div className="mb-4">
        <Label>{t("pl_image")}</Label>
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

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <Label>{t("pl_qr_code")} — <span className="font-rune text-gold-bright">{form.code}</span></Label>
          <div className="flex items-center gap-3">
            {qrUrl && <img src={qrUrl} alt="QR code" className="w-16 h-16 rounded-lg border border-gold-dim/50 bg-parchment" />}
            <Button type="button" variant="ghost" size="sm" onClick={downloadQr} disabled={!qrUrl}>
              <Download size={14} /> {t("pl_qr_download")}
            </Button>
          </div>
        </div>
        <div>
          <Label>{t("pl_gps_qr")}</Label>
          <div className="flex items-center gap-3">
            {gpsQrUrl ? (
              <img src={gpsQrUrl} alt="GPS QR code" className="w-16 h-16 rounded-lg border border-arcane/60 bg-parchment" />
            ) : (
              <div className="w-16 h-16 rounded-lg border border-dashed border-void-border flex items-center justify-center text-muted text-[10px] text-center px-1">
                {t("pl_lat")}/{t("pl_lng")}
              </div>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={downloadGpsQr} disabled={!gpsQrUrl}>
              <Download size={14} /> {t("pl_gps_qr_download")}
            </Button>
          </div>
        </div>
      </div>

      <LevelContentEditor form={form} set={set} />

      <div className="flex items-center justify-between mb-6">
        <Label className="mb-0">{t("pl_is_active")}</Label>
        <Switch checked={form.is_active} onChange={(v) => set("is_active", v)} />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => onClose(false)}>{t("common_cancel")}</Button>
        <Button onClick={handleSave} disabled={!form.real_name || saving}>{t("common_save")}</Button>
      </div>
    </Modal>
  );
}