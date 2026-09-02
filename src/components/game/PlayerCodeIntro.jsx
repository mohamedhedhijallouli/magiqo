import React from "react";
import { motion } from "framer-motion";
import { KeyRound, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

// Affiché une seule fois, juste après la création d'un NOUVEAU profil
// joueur (voir handlePlayerSubmit dans Play.jsx) — avant même la première
// devinette. Un joueur qui a tapé son propre code pour revenir ne voit
// jamais cet écran, il le connaît déjà.
export default function PlayerCodeIntro({ code, onContinue }) {
  const { t } = useLanguage();
  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md mx-auto">
      <Card>
        <CardContent className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gold/15 border border-gold-dim/40 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="text-gold" size={24} />
          </div>
          <h2 className="font-display text-xl text-parchment mb-2">{t("pci_title")}</h2>
          <p className="text-sm text-muted mb-5">{t("pci_hint")}</p>

          <div className="bg-void/50 border-2 border-dashed border-gold-dim/50 rounded-2xl py-5 mb-6">
            <p className="font-rune text-4xl tracking-[0.4em] text-gold-bright">{code}</p>
          </div>

          <Button className="w-full" onClick={onContinue}>
            <Sparkles size={15} /> {t("pci_continue")}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
