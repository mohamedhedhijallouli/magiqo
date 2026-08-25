import React, { useRef, useEffect, useState } from "react";
import jsQR from "jsqr";
import { X, CameraOff, ScanLine } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Button from "@/components/ui/Button";

// Generic camera QR scanner: requests the device camera, continuously scans
// frames with jsQR, and calls onDetect(text) the moment a code is found.
// Used both for the player-ticket step and for in-game object/animal/place
// code entry, so a physical card only ever needs one printed QR to work
// everywhere in the app.
export default function QrScannerModal({ open, onClose, onDetect }) {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError("");

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch (e) {
        setError(t("qr_scan_error"));
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
      if (code && code.data) {
        onDetect(code.data);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-void/95 backdrop-blur-sm flex flex-col items-center justify-center p-6">
      <button onClick={onClose} className="absolute top-5 right-5 rtl:right-auto rtl:left-5 text-muted hover:text-parchment">
        <X size={22} />
      </button>

      <h3 className="font-display text-lg text-gold-bright mb-4 flex items-center gap-2">
        <ScanLine size={18} /> {t("qr_scan_title")}
      </h3>

      {error ? (
        <div className="flex flex-col items-center gap-3 text-center max-w-xs">
          <CameraOff size={32} className="text-ember-bright" />
          <p className="text-sm text-muted">{error}</p>
          <Button variant="ghost" size="sm" onClick={onClose}>{t("common_close")}</Button>
        </div>
      ) : (
        <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-2 border-gold-dim/50">
          <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-6 border-2 border-gold-bright/70 rounded-xl pointer-events-none animate-pulse" />
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />

      <p className="text-xs text-muted mt-4 text-center max-w-xs">{t("qr_scan_hint")}</p>
    </div>
  );
}
