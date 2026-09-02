import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Stages: charging (ring appears, energy builds) -> opening (doors slide apart)
// -> flare (light bursts through) -> gone (unmounted, main UI takes over).
export default function MagicPortalIntro({ onDone }) {
  const [stage, setStage] = useState("charging");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      onDone();
      return;
    }
    const t1 = setTimeout(() => setStage("opening"), 900);
    const t2 = setTimeout(() => setStage("flare"), 1650);
    const t3 = setTimeout(() => onDone(), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  const isOpen = stage === "opening" || stage === "flare";
  const size = 300;

  return (
    <AnimatePresence>
      {stage !== "gone" && (
        <motion.div
          className="relative flex items-center justify-center"
          style={{ width: size, height: size }}
          exit={{ opacity: 0, scale: 1.15 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* outer ambient glow, breathing */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(139,123,240,0.35), rgba(232,178,77,0.12) 55%, transparent 75%)" }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0.5, 0.85, 0.5], scale: isOpen ? 1.35 : 1.05 }}
            transition={{ opacity: { duration: 2.4, repeat: Infinity }, scale: { duration: 0.8, ease: "easeOut" } }}
          />

          {/* light flare once open */}
          <AnimatePresence>
            {stage === "flare" && (
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(246,212,136,0.6) 35%, rgba(139,123,240,0.3) 60%, transparent 78%)" }}
                initial={{ width: 0, height: 0, opacity: 0 }}
                animate={{ width: size * 1.9, height: size * 1.9, opacity: [0, 1, 0] }}
                transition={{ duration: 0.85, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>

          {/* rotating energy ring (conic gradient masked into a thin ring) */}
          <motion.div
            className="absolute inset-3 rounded-full animate-spin"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, #E8B24D 12%, transparent 24%, transparent 50%, #8B7BF0 62%, transparent 74%, transparent 100%)",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 5px))",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 5px))",
              animationDuration: "5s",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isOpen ? 0.9 : 0.55 }}
            transition={{ duration: 0.6 }}
          />

          {/* orbiting particles / sparks */}
          {Array.from({ length: 7 }).map((_, i) => {
            const angle = (i / 7) * 360;
            const radius = size / 2 - 6;
            return (
              <motion.span
                key={i}
                className="absolute rounded-full"
                style={{
                  width: i % 2 ? 4 : 3,
                  height: i % 2 ? 4 : 3,
                  background: i % 3 === 0 ? "#E8B24D" : "#8B7BF0",
                  boxShadow: "0 0 6px currentColor",
                  left: "50%",
                  top: "50%",
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: [
                    Math.cos((angle * Math.PI) / 180) * radius,
                    Math.cos(((angle + 360) * Math.PI) / 180) * radius,
                  ],
                  y: [
                    Math.sin((angle * Math.PI) / 180) * radius,
                    Math.sin(((angle + 360) * Math.PI) / 180) * radius,
                  ],
                  opacity: [0, 0.9, 0.9, 0],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: i * 0.25 }}
              />
            );
          })}

          {/* static ornate ring border */}
          <motion.svg
            viewBox="0 0 300 300"
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <circle cx="150" cy="150" r="144" fill="none" stroke="#E8B24D" strokeWidth="2" opacity="0.85" />
            <circle cx="150" cy="150" r="132" fill="none" stroke="#8B7BF0" strokeWidth="1" opacity="0.4" />
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const x1 = 150 + Math.cos(a) * 144;
              const y1 = 150 + Math.sin(a) * 144;
              const x2 = 150 + Math.cos(a) * 152;
              const y2 = 150 + Math.sin(a) * 152;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F6D488" strokeWidth="1.5" opacity="0.7" />;
            })}
          </motion.svg>

          {/* portal interior: the two doors, plus the "world" glimpsed once open */}
          <div className="absolute rounded-full overflow-hidden" style={{ inset: 14 }}>
            {/* mysterious world behind the doors */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, rgba(139,123,240,0.55), rgba(24,18,51,0.95) 60%, rgba(15,12,31,1) 100%)",
              }}
            >
              {isOpen &&
                Array.from({ length: 16 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute rounded-full bg-gold-bright"
                    style={{
                      width: Math.random() > 0.7 ? 2.5 : 1.5,
                      height: Math.random() > 0.7 ? 2.5 : 1.5,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.4, 1] }}
                    transition={{ duration: 1.6 + Math.random(), repeat: Infinity, delay: Math.random() * 0.8 }}
                  />
                ))}
            </div>

            {/* left door */}
            <motion.div
              className="absolute top-0 bottom-0 left-0"
              style={{
                width: "50%",
                background: "linear-gradient(90deg, #211A42 0%, #181233 85%)",
                borderRight: "1px solid rgba(232,178,77,0.5)",
              }}
              animate={{ x: isOpen ? "-100%" : "0%" }}
              transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
            />
            {/* right door */}
            <motion.div
              className="absolute top-0 bottom-0 right-0"
              style={{
                width: "50%",
                background: "linear-gradient(270deg, #211A42 0%, #181233 85%)",
                borderLeft: "1px solid rgba(232,178,77,0.5)",
              }}
              animate={{ x: isOpen ? "100%" : "0%" }}
              transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
