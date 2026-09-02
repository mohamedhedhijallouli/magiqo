import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, Check, X, ScanLine } from "lucide-react";
import confetti from "canvas-confetti";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";
import { normalizeCode } from "@/lib/gameData";
import { cn } from "@/lib/utils";
import QrScannerModal from "@/components/shared/QrScannerModal";

// Équivalent de CodeEntry.jsx pour le World "Dossier Classifié" : le champ
// de saisie devient une fiche d'identification de pièce à conviction
// plutôt qu'une serrure magique. Même contrat de props que l'original.
export default function DossierCodeEntry({ expectedCode, onCorrect, onWrong }) {
  const { t } = useLanguage();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  function submit(raw) {
    const candidate = raw !== undefined ? raw : value;
    const ok = normalizeCode(candidate) === normalizeCode(expectedCode);
    if (ok) {
      setStatus("ok");
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 }, colors: ["#C4A45C", "#786C5C", "#A8365A"] });
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
      <div className="bg-parchment/95 text-void rounded-sm border border-void-border/40 shadow-[0_18px_40px_rgba(0,0,0,0.45)] px-6 py-6">
        <div className="flex items-center gap-2 mb-5 justify-center text-void/70">
          <FileSearch size={18} />
          <h3 className="font-rune text-xs uppercase tracking-[0.2em]">{t("oc_enter_code")}</h3>
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
            "w-full text-center font-rune text-3xl tracking-[0.4em] uppercase py-5 rounded-sm bg-white/40 border-2 transition-colors text-void",
            "focus:outline-none placeholder:text-void/30 placeholder:tracking-normal placeholder:text-base",
            status === "ok" && "border-emerald ring-4 ring-emerald/20",
            status === "ko" && "border-ember ring-4 ring-ember/20",
            !status && "border-void/30 focus:border-void/60"
          )}
        />

        <AnimatePresence>
          {status && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex items-center justify-center gap-1.5 mt-3 text-sm font-bold font-rune",
                status === "ok" ? "text-emerald" : "text-ember"
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
          className="w-full mt-2 flex items-center justify-center gap-2 text-void/60 hover:text-void text-xs uppercase tracking-widest font-rune py-2"
        >
          <ScanLine size={14} /> {t("qr_scan_button")}
        </button>
      </div>

      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetect={handleScanned} />
    </div>
  );
}
