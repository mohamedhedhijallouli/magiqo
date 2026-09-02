import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function RevealCard({ stop, onContinue }) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotateY: -25 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ type: "spring", damping: 16 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="overflow-hidden">
        <div className="h-56 flex items-center justify-center text-7xl relative bg-gradient-to-b from-gold/15 to-transparent">
          {stop.image_url ? (
            <img src={stop.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="drop-shadow-lg">{stop.emoji || "✨"}</span>
          )}
        </div>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2 text-gold-bright mb-2">
            <Sparkles size={18} />
            <h3 className="font-display text-xl">{t("reveal_title")}</h3>
          </div>
          <p className="text-parchment/90 font-semibold mb-1">{stop.displayName}</p>
          {stop.real_name && stop.real_name !== stop.displayName && (
            <p className="text-muted text-sm mb-5">{stop.real_name}</p>
          )}
          <Button className="w-full mt-4" onClick={onContinue}>
            {t("reveal_continue")}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
