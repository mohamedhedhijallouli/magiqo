import React from "react";
import { motion } from "framer-motion";
import { SatelliteDish } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";

// Équivalent de RevealCard.jsx pour l'archétype "dashboard" : une
// transmission décodée plutôt qu'un éclat de magie. Même contrat de props
// que l'original.
export default function DashboardRevealCard({ stop, onContinue }) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 15 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-void-panel/90 border border-arcane/40 rounded-lg overflow-hidden">
        <div className="h-56 flex items-center justify-center text-7xl relative bg-void/50">
          {stop.image_url ? (
            <img src={stop.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{stop.emoji || "🪐"}</span>
          )}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-void/70 border border-arcane/50 rounded px-3 py-1 text-[10px] font-rune tracking-widest text-arcane">
            <SatelliteDish size={11} /> {t("dashboard_decoded")}
          </div>
        </div>
        <div className="text-center px-6 py-6">
          <p className="font-rune text-[10px] uppercase tracking-[0.2em] text-arcane mb-2">{t("reveal_title")}</p>
          <p className="font-display text-xl text-gold-bright mb-1">{stop.displayName}</p>
          {stop.real_name && stop.real_name !== stop.displayName && (
            <p className="text-muted text-sm mb-5 font-rune">{stop.real_name}</p>
          )}
          <Button className="w-full mt-4" onClick={onContinue}>
            {t("reveal_continue")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
