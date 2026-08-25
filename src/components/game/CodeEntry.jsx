import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeySquare, Check, X, ScanLine } from "lucide-react";
import confetti from "canvas-confetti";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { normalizeCode } from "@/lib/gameData";
import { cn } from "@/lib/utils";
import QrScannerModal from "@/components/shared/QrScannerModal";

export default function CodeEntry({ expectedCode, onCorrect, onWrong }) {
  const { t } = useLanguage();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState(null); // 'ok' | 'ko'
  const [scannerOpen, setScannerOpen] = useState(false);

  function submit(raw) {
    const candidate = raw !== undefined ? raw : value;
    const ok = normalizeCode(candidate) === normalizeCode(expectedCode);
    if (ok) {
      setStatus("ok");
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ["#E8B24D", "#8B7BF0", "#3FB88A"] });
      setTimeout(() => onCorrect(), 700);
    } else {
      setStatus("ko");
      onWrong?.();
      setTimeout(() => setStatus(null), 700);
      setValue("");
    }
  }

  // Le joueur peut soit taper le code (objet/lieu/animal), soit scanner
  // directement le QR code imprimé sur la carte — les deux encodent la même
  // valeur, donc scanner revient simplement à pré-remplir puis valider.
  function handleScanned(text) {
    setScannerOpen(false);
    const code = text.trim().toUpperCase();
    setValue(code);
    submit(code);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-5 justify-center">
            <KeySquare className="text-gold" size={20} />
            <h3 className="font-display text-lg text-parchment">{t("oc_enter_code")}</h3>
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
              "w-full text-center font-rune text-3xl tracking-[0.4em] uppercase py-5 rounded-2xl bg-void/60 border-2 transition-colors",
              "focus:outline-none placeholder:text-muted/40 placeholder:tracking-normal placeholder:text-base",
              status === "ok" && "border-emerald ring-4 ring-emerald/30",
              status === "ko" && "border-ember ring-4 ring-ember/30",
              !status && "border-void-border focus:border-arcane animate-glow-pulse"
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
          <Button variant="ghost" className="w-full mt-2" onClick={() => setScannerOpen(true)}>
            <ScanLine size={16} /> {t("qr_scan_button")}
          </Button>
        </CardContent>
      </Card>

      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetect={handleScanned} />
    </div>
  );
}
