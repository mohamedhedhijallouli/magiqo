import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check, X, ScanLine } from "lucide-react";
import confetti from "canvas-confetti";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";
import { normalizeCode } from "@/lib/gameData";
import { cn } from "@/lib/utils";
import QrScannerModal from "@/components/shared/QrScannerModal";

// Équivalent de CodeEntry.jsx pour l'archétype "map" : on "ouvre le coffre"
// avec des coordonnées plutôt que de prononcer un mot magique. Même
// contrat de props que l'original.
export default function MapCodeEntry({ expectedCode, onCorrect, onWrong }) {
  const { t } = useLanguage();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  function submit(raw) {
    const candidate = raw !== undefined ? raw : value;
    const ok = normalizeCode(candidate) === normalizeCode(expectedCode);
    if (ok) {
      setStatus("ok");
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 }, colors: ["#D4B060", "#4E946C", "#B45C30"] });
      setTimeout(() => onCorrect(), 700);
    } else {
      setStatus("ko");
      onWrong?.();
      setTimeout(() => setStatus(null), 700);
      setValue("");
    }
  }

  function handleScanned(text) {
    setScannerOpen(false);
    const code = text.trim().toUpperCase();
    setValue(code);
    submit(code);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-void-panel/90 border-2 border-dashed border-gold-dim/50 rounded-2xl px-6 py-7">
        <div className="flex flex-col items-center gap-2 mb-5">
          <div className="w-14 h-14 rounded-full bg-gold-dim/20 border-2 border-gold-dim/50 flex items-center justify-center">
            <Lock size={22} className="text-gold" />
          </div>
          <h3 className="font-rune text-xs uppercase tracking-[0.2em] text-gold-dim">{t("map_open_chest")}</h3>
        </div>

        <motion.input
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && value && submit()}
          placeholder={t("oc_code_placeholder")}
          maxLength={4}
          autoFocus
          animate={status === "ko" ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.45 }}
          className={cn(
            "w-full text-center font-rune text-3xl tracking-[0.4em] uppercase py-5 rounded-xl bg-void/50 border-2 transition-colors text-parchment",
            "focus:outline-none placeholder:text-muted/40 placeholder:tracking-normal placeholder:text-base",
            status === "ok" && "border-emerald ring-4 ring-emerald/20",
            status === "ko" && "border-ember ring-4 ring-ember/20",
            !status && "border-gold-dim/40 focus:border-gold-dim"
          )}
        />

        <AnimatePresence>
          {status && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex items-center justify-center gap-1.5 mt-3 text-sm font-bold",
                status === "ok" ? "text-emerald-bright" : "text-ember-bright"
              )}
            >
              {status === "ok" ? <Check size={16} /> : <X size={16} />}
              {status === "ok" ? t("oc_correct_code") : t("oc_wrong_code")}
            </motion.p>
          )}
        </AnimatePresence>

        <Button className="w-full mt-5" disabled={value.length < 3 || status} onClick={() => submit()}>
          {t("oc_validate_code")}
        </Button>
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="w-full mt-2 flex items-center justify-center gap-2 text-muted hover:text-gold-bright text-xs uppercase tracking-widest font-rune py-2"
        >
          <ScanLine size={14} /> {t("qr_scan_button")}
        </button>
      </div>

      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetect={handleScanned} />
    </div>
  );
}
