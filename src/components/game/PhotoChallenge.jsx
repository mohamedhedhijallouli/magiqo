import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, X, RefreshCw, Sparkles, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";
import { fileToDataUrl } from "@/lib/db";
import { matchesReference } from "@/lib/perceptualHash";
import { recognizeObjectWithAI, isVisionConfigured } from "@/lib/aiVision";
import { cn } from "@/lib/utils";

// Écran de validation par PHOTO — alternative à CodeEntry quand
// stop.validation_mode vaut "photo_local" (comparaison d'empreinte
// perceptuelle, sans IA, 100% dans le navigateur) ou "photo_ai"
// (reconnaissance par un modèle de vision, via un endpoint serveur
// configuré dans Admin). Même contrat que les autres écrans de
// déverrouillage : onCorrect() / onWrong().
//
// Ce composant n'a volontairement PAS de variante par archétype (Dossier,
// Carte, Arène...) : il hérite déjà des couleurs et polices du World actif
// via les classes thémables (bg-void-panel, text-gold-bright, ...), ce qui
// suffit à le faire "coller" à n'importe quel univers sans dupliquer 6 fois
// la logique caméra.
export default function PhotoChallenge({ stop, onCorrect, onWrong }) {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [photo, setPhoto] = useState(null); // data URL de la photo prise
  const [status, setStatus] = useState("idle"); // idle | checking | ok | ko | error
  const [detail, setDetail] = useState(null); // { similarity } ou { confidence, reason }
  const [usedFallback, setUsedFallback] = useState(false);

  const mode = stop.validation_mode === "photo_ai" ? "ai" : "local";

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setPhoto(dataUrl);
    setStatus("idle");
    setDetail(null);
    setUsedFallback(false);
  }

  async function verify() {
    if (!photo) return;
    setStatus("checking");
    try {
      if (mode === "ai" && isVisionConfigured()) {
        const res = await recognizeObjectWithAI(photo, stop.description || stop.real_name || stop.displayName);
        setDetail({ confidence: res.confidence, reason: res.reason });
        settle(res.match);
        return;
      }
      // Mode local, ou repli si l'IA n'est pas configurée / a échoué.
      if (mode === "ai") setUsedFallback(true);
      if (!stop.photo_hash) {
        // Aucune empreinte de référence disponible : on ne peut pas valider
        // automatiquement. On laisse passer avec un avertissement plutôt
        // que de bloquer le joueur à cause d'une config manquante côté admin.
        setDetail(null);
        settle(true);
        return;
      }
      const res = await matchesReference(photo, stop.photo_hash, stop.photo_threshold || 85);
      setDetail({ similarity: res.similarity });
      settle(res.match);
    } catch {
      if (mode === "ai" && stop.photo_hash) {
        // L'appel IA a échoué (endpoint injoignable) : repli silencieux sur
        // la comparaison locale plutôt que de bloquer le joueur.
        setUsedFallback(true);
        try {
          const res = await matchesReference(photo, stop.photo_hash, stop.photo_threshold || 85);
          setDetail({ similarity: res.similarity });
          settle(res.match);
          return;
        } catch { /* tombe dans le cas d'erreur générique ci-dessous */ }
      }
      setStatus("error");
    }
  }

  function settle(match) {
    if (match) {
      setStatus("ok");
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      setTimeout(() => onCorrect(), 700);
    } else {
      setStatus("ko");
      onWrong?.();
    }
  }

  function retake() {
    setPhoto(null);
    setStatus("idle");
    setDetail(null);
    inputRef.current && (inputRef.current.value = "");
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-void-panel/90 border border-void-border rounded-2xl px-6 py-7">
        <div className="flex items-center justify-center gap-2 mb-5">
          {mode === "ai" ? <Sparkles size={16} className="text-arcane" /> : <ShieldCheck size={16} className="text-emerald" />}
          <h3 className="font-rune text-xs uppercase tracking-[0.2em] text-muted">
            {mode === "ai" ? t("photo_title_ai") : t("photo_title_local")}
          </h3>
        </div>

        <div
          className={cn(
            "relative aspect-square rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden mb-4",
            status === "ok" && "border-emerald",
            status === "ko" && "border-ember",
            status === "idle" || status === "checking" || status === "error" ? "border-void-border" : ""
          )}
        >
          {photo ? (
            <img src={photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted">
              <Camera size={32} />
              <span className="text-xs">{t("photo_placeholder")}</span>
            </div>
          )}

          <AnimatePresence>
            {status === "checking" && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-void/70 flex items-center justify-center"
              >
                <RefreshCw size={26} className="text-gold-bright animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {status === "ok" && (
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-1.5 text-sm font-bold text-emerald mb-3">
              <Check size={16} />
              {t("photo_match")}
              {detail?.similarity != null && <span className="text-xs font-normal text-muted">({detail.similarity}%)</span>}
              {detail?.confidence != null && <span className="text-xs font-normal text-muted">({detail.confidence}%)</span>}
            </motion.p>
          )}
          {status === "ko" && (
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-1.5 text-sm font-bold text-ember mb-3">
              <X size={16} />
              {t("photo_no_match")}
              {detail?.similarity != null && <span className="text-xs font-normal text-muted">({detail.similarity}%)</span>}
            </motion.p>
          )}
          {status === "error" && (
            <p className="text-center text-xs text-ember-bright mb-3">{t("photo_error")}</p>
          )}
        </AnimatePresence>

        {usedFallback && status !== "idle" && (
          <p className="text-center text-[10px] text-muted mb-3">{t("photo_fallback_note")}</p>
        )}

        {!photo ? (
          <label className="block">
            <span className="btn-file w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-gold-bright to-gold text-void font-bold text-sm cursor-pointer">
              <Camera size={16} /> {t("photo_take")}
            </span>
            <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          </label>
        ) : status === "ko" || status === "error" ? (
          <Button className="w-full" variant="ghost" onClick={retake}>
            <RefreshCw size={14} /> {t("photo_retake")}
          </Button>
        ) : status === "idle" ? (
          <div className="flex gap-2">
            <Button className="flex-1" variant="ghost" onClick={retake}>{t("photo_retake")}</Button>
            <Button className="flex-1" onClick={verify}>{t("photo_verify")}</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
