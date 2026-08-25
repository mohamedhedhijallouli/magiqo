import React from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";

// Équivalent de RevealCard.jsx pour l'archétype "map" : la révélation est
// scellée par un "X marque l'endroit" plutôt qu'un éclat de magie. Même
// contrat de props que l'original.
export default function MapRevealCard({ stop, onContinue }) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 14 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-void-panel/90 border-2 border-dashed border-gold-dim/50 rounded-2xl overflow-hidden shadow-glow">
        <div className="h-56 flex items-center justify-center text-7xl relative bg-void/40">
          {stop.image_url ? (
            <img src={stop.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{stop.emoji || "🗺️"}</span>
          )}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: -8 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 220 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="font-display text-8xl text-ember/80 drop-shadow-[0_0_12px_rgba(0,0,0,0.6)]">✕</span>
          </motion.div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-void/70 border border-gold-dim/50 rounded-full px-3 py-1 text-[10px] font-rune tracking-widest text-gold">
            <MapPin size={11} /> {t("map_spot_marked")}
          </div>
        </div>
        <div className="text-center px-6 py-6">
          <p className="font-rune text-[10px] uppercase tracking-[0.2em] text-gold-dim mb-2">{t("reveal_title")}</p>
          <p className="font-display text-xl text-gold-bright mb-1">{stop.displayName}</p>
          {stop.real_name && stop.real_name !== stop.displayName && (
            <p className="text-muted text-sm mb-5">{stop.real_name}</p>
          )}
          <Button className="w-full mt-4" onClick={onContinue}>
            {t("reveal_continue")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
