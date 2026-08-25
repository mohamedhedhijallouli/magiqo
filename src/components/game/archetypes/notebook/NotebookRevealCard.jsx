import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";

// Équivalent de RevealCard.jsx pour l'archétype "notebook" : une photo
// collée au carnet, coins de ruban, tampon "espèce/lieu identifié(e)".
// Même contrat de props que l'original.
export default function NotebookRevealCard({ stop, onContinue }) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: 1 }}
      animate={{ opacity: 1, scale: 1, rotate: 0.6 }}
      transition={{ type: "spring", damping: 16 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-parchment/95 text-void rounded-md border border-void-border/30 shadow-[0_16px_36px_rgba(0,0,0,0.4)] overflow-hidden relative">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-6 bg-emerald/40 rotate-[-3deg] rounded-sm z-10" />
        <div className="h-56 flex items-center justify-center text-7xl relative bg-void/10 m-3 rounded-sm border border-void/15">
          {stop.image_url ? (
            <img src={stop.image_url} alt="" className="h-full w-full object-cover rounded-sm" />
          ) : (
            <span>{stop.emoji || "🌿"}</span>
          )}
        </div>
        <div className="text-center px-6 py-5">
          <div className="inline-flex items-center gap-1.5 text-emerald font-rune text-[10px] tracking-widest mb-2">
            <CheckCircle2 size={12} /> {t("notebook_identified")}
          </div>
          <p className="font-display text-xl text-void mb-1">{stop.displayName}</p>
          {stop.real_name && stop.real_name !== stop.displayName && (
            <p className="text-void/50 text-sm mb-5 italic">{stop.real_name}</p>
          )}
          <Button className="w-full mt-4" onClick={onContinue}>
            {t("reveal_continue")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
