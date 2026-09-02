import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TreasureChestIntro({ onDone }) {
  const [stage, setStage] = useState("closed"); // closed -> opening -> open -> burst -> gone

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      onDone();
      return;
    }
    const t1 = setTimeout(() => setStage("opening"), 550);
    const t2 = setTimeout(() => setStage("open"), 1250);
    const t3 = setTimeout(() => setStage("burst"), 1450);
    const t4 = setTimeout(() => onDone(), 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onDone]);

  const lidOpen = stage === "opening" || stage === "open" || stage === "burst";

  return (
    <AnimatePresence>
      {stage !== "gone" && (
        <motion.div
          className="flex flex-col items-center justify-center"
          exit={{ opacity: 0, scale: 1.25 }}
          transition={{ duration: 0.45 }}
        >
          <div className="relative" style={{ width: 220, height: 190, perspective: 700 }}>
            {/* ambient glow under the chest */}
            <motion.div
              className="absolute left-1/2 bottom-4 -translate-x-1/2 rounded-full"
              style={{ width: 140, height: 30, background: "radial-gradient(ellipse, rgba(232,178,77,0.35), transparent 70%)" }}
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />

            {/* light burst from inside once open */}
            <AnimatePresence>
              {lidOpen && (
                <motion.div
                  className="absolute left-1/2 rounded-full pointer-events-none"
                  style={{
                    top: 40,
                    background:
                      "radial-gradient(circle, rgba(246,212,136,0.95), rgba(139,123,240,0.45) 45%, transparent 72%)",
                  }}
                  initial={{ width: 0, height: 0, x: "-50%", opacity: 0 }}
                  animate={{ width: 260, height: 260, x: "-50%", opacity: [0, 1, 0.7] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>

            {/* sparkle particles bursting outward */}
            {stage === "burst" &&
              Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                return (
                  <motion.span
                    key={i}
                    className="absolute rounded-full bg-gold-bright"
                    style={{ left: "50%", top: 78, width: 5, height: 5 }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(angle) * 100,
                      y: Math.sin(angle) * 100 - 30,
                      opacity: 0,
                      scale: 0.4,
                    }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                );
              })}

            {/* ---- 3D chest ---- */}
            <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
              {/* base / body */}
              <div
                className="absolute left-1/2 bottom-6 -translate-x-1/2 rounded-b-2xl rounded-t-md"
                style={{
                  width: 170,
                  height: 90,
                  background: "linear-gradient(180deg, #8A6535 0%, #5A3D1E 55%, #3E2A14 100%)",
                  border: "2px solid #E8B24D",
                  boxShadow: "0 10px 26px rgba(0,0,0,0.45), inset 0 0 18px rgba(0,0,0,0.35)",
                }}
              >
                {/* horizontal metal band */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-4 bg-gradient-to-b from-gold-bright to-gold-dim opacity-90" />
                {/* vertical bands */}
                <div className="absolute top-0 bottom-0 left-4 w-2 bg-gold-dim/70" />
                <div className="absolute top-0 bottom-0 right-4 w-2 bg-gold-dim/70" />
                {/* lock */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md"
                  style={{ width: 20, height: 24, background: "linear-gradient(180deg,#F6D488,#9C7A38)", boxShadow: "0 0 10px rgba(232,178,77,0.6)" }}
                >
                  <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-3 h-3 rounded-full border-2 border-gold-dim" style={{ background: "transparent" }} />
                </div>
              </div>

              {/* lid — hinged at its own bottom edge (= back-top of the base), rotates open as ONE solid piece */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 rounded-t-2xl"
                style={{
                  width: 176,
                  height: 62,
                  bottom: 92,
                  background: "linear-gradient(180deg, #9C7440 0%, #6B4A24 60%, #4A331A 100%)",
                  border: "2px solid #E8B24D",
                  borderBottom: "none",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
                  transformOrigin: "50% 100%",
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
                animate={{
                  rotateX: stage === "closed" ? 0 : stage === "opening" ? -70 : -125,
                }}
                transition={{ duration: 0.7, ease: [0.34, 1.1, 0.64, 1] }}
              >
                <div className="absolute left-0 right-0 bottom-2 h-3 bg-gradient-to-b from-gold-bright to-gold-dim opacity-90" />
                <div className="absolute top-2 bottom-2 left-4 w-2 bg-gold-dim/70" />
                <div className="absolute top-2 bottom-2 right-4 w-2 bg-gold-dim/70" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
