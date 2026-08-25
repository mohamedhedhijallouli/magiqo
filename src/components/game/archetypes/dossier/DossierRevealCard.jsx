import React from "react";
import { motion } from "framer-motion";
import { Stamp } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";

// Équivalent de RevealCard.jsx pour le World "Dossier Classifié" : la
// révélation prend la forme d'une photo agrafée à une fiche d'identification
// tamponnée "IDENTIFIÉ", plutôt qu'un éclat de magie. Même contrat de props.
export default function DossierRevealCard({ stop, onContinue }) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: -1 }}
      transition={{ type: "spring", damping: 16 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-parchment/95 text-void rounded-sm border border-void-border/40 shadow-[0_18px_40px_rgba(0,0,0,0.45)] overflow-hidden">
        <div className="h-56 flex items-center justify-center text-7xl relative bg-void/10 border-b-2 border-dashed border-void/30">
          {stop.image_url ? (
            <img src={stop.image_url} alt="" className="h-full w-full object-cover grayscale-[30%] contrast-110" />
          ) : (
            <span>{stop.emoji || "📎"}</span>
          )}
          <div className="absolute top-3 right-4 rotate-[8deg] border-2 border-emerald/70 text-emerald/80 font-rune text-[10px] tracking-widest px-2 py-1 rounded-sm flex items-center gap-1 bg-parchment/90">
            <Stamp size={11} /> {t("dossier_identified")}
          </div>
        </div>
        <div className="text-center px-6 py-6">
          <p className="font-rune text-[10px] uppercase tracking-[0.2em] text-void/50 mb-2">{t("reveal_title")}</p>
          <p className="font-display text-xl text-void mb-1">{stop.displayName}</p>
          {stop.real_name && stop.real_name !== stop.displayName && (
            <p className="text-void/50 text-sm mb-5">{stop.real_name}</p>
          )}
          <Button className="w-full mt-4" onClick={onContinue}>
            {t("reveal_continue")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
