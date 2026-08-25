import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Parents, Parcours } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

// V19 : le joueur introduit directement le code du parcours (celui remis
// sur sa carte/QR physique) — il n'a plus besoin de connaître le code de
// son tuteur au préalable. Une seule étape, plus proche de l'expérience
// "chasse au trésor".
export default function ParcoursCodeEntry({ onSelect }) {
  const { t } = useLanguage();
  const [parcoursCode, setParcoursCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitParcoursCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const clean = parcoursCode.trim().toUpperCase();
    const allTrails = await Parcours.filter({ is_active: true });
    const found = allTrails.find((tr) => (tr.access_code || "").toUpperCase() === clean);
    const usable = found && (!found.created_by_admin || found.approved_by_parent) ? found : null;
    let parent = null;
    if (usable) {
      const parents = await Parents.filter({ parent_code: usable.parent_code, is_active: true });
      parent = parents[0] || null;
    }
    await new Promise((r) => setTimeout(r, 350));
    setLoading(false);
    if (!usable || !parent) {
      setError(t("pce_parcours_error"));
      return;
    }
    onSelect(parent, usable);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardContent>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-arcane/15 flex items-center justify-center border border-arcane-dim/40">
              <MapPin className="text-gold" size={20} />
            </div>
            <h2 className="font-display text-xl text-parchment">{t("pce_title")}</h2>
          </div>

          <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onSubmit={submitParcoursCode}>
            <Label>{t("pce_parcours_label")}</Label>
            <Input
              autoFocus
              value={parcoursCode}
              onChange={(e) => setParcoursCode(e.target.value)}
              placeholder={t("pce_parcours_placeholder")}
              className="text-center font-rune text-2xl tracking-[0.3em] uppercase py-4"
            />
            {error && <p className="text-ember-bright text-sm mt-2">{error}</p>}
            <Button type="submit" className="w-full mt-5" disabled={!parcoursCode || loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
              {loading ? t("pce_verify") : t("pce_launch")}
            </Button>
          </motion.form>
        </CardContent>
      </Card>
    </div>
  );
}

