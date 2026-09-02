import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PortalVortex from "@/components/game/PortalVortex";
import EmergingM from "@/components/game/EmergingM";

export default function PortalRevealIntro({ onDone }) {
  const [phase, setPhase] = useState("forming"); // forming -> active -> emerging -> out -> gone
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      onDone();
      return;
    }
    const timers = [
      setTimeout(() => setIntensity(1), 50),
      setTimeout(() => setPhase("active"), 750),
      setTimeout(() => setPhase("emerging"), 1450),
      setTimeout(() => setPhase("out"), 2150),
      setTimeout(() => onDone(), 2950),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const mStage = phase === "forming" || phase === "active" ? "hidden" : phase === "emerging" ? "emerging" : "out";

  return (
    <AnimatePresence>
      {phase !== "gone" && (
        <motion.div
          className="relative flex items-center justify-center"
          style={{ width: 380, height: 380 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <PortalVortex intensity={intensity} size={300} />
          <EmergingM stage={mStage} portalSize={300} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
