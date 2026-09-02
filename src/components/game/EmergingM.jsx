import React from "react";
import { motion } from "framer-motion";

// stage: 'hidden' | 'emerging' | 'out'
export default function EmergingM({ stage, portalSize = 340 }) {
  const variants = {
    hidden: { y: 40, scale: 0.35, opacity: 0 },
    emerging: { y: 6, scale: 0.85, opacity: 1 },
    out: { y: 34, scale: 1.15, opacity: 1 },
  };

  return (
    <div
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{ width: portalSize, height: portalSize, transform: "translate(-50%, -50%)" }}
    >
      {/* crossing seam — a bright horizontal glow where the M pierces the portal's lower rim */}
      {(stage === "emerging" || stage === "out") && (
        <motion.div
          className="absolute left-1/2 rounded-full"
          style={{
            top: "62%",
            width: portalSize * 0.62,
            height: 14,
            background: "radial-gradient(ellipse, rgba(255,255,255,0.9), rgba(246,212,136,0.6) 45%, transparent 80%)",
            filter: "blur(3px)",
          }}
          initial={{ x: "-50%", opacity: 0, scaleX: 0.3 }}
          animate={{ opacity: [0, 1, 0.7], scaleX: [0.3, 1.1, 1] }}
          transition={{ duration: 0.6 }}
        />
      )}

      {/* small energy motes scattering sideways at the crossing moment */}
      {stage === "out" &&
        Array.from({ length: 8 }).map((_, i) => {
          const dir = i % 2 === 0 ? 1 : -1;
          return (
            <motion.span
              key={i}
              className="absolute rounded-full bg-gold-bright"
              style={{ left: "50%", top: "62%", width: 3, height: 3 }}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: dir * (30 + i * 8), y: (Math.random() - 0.5) * 20, opacity: 0 }}
              transition={{ duration: 0.7, delay: i * 0.04, ease: "easeOut" }}
            />
          );
        })}

      {/* the M itself */}
      <motion.svg
        viewBox="0 0 64 64"
        className="absolute left-1/2 top-1/2"
        style={{ width: 130, height: 130, marginLeft: -65, marginTop: -65 }}
        initial="hidden"
        animate={stage}
        variants={variants}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <defs>
          <linearGradient id="em-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F6D488" />
            <stop offset="0.55" stopColor="#E8B24D" />
            <stop offset="1" stopColor="#9C7A38" />
          </linearGradient>
        </defs>
        <path
          d="M12 46 L12 20 L32 34 L52 20 L52 46"
          fill="none"
          stroke="url(#em-grad)"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 10px rgba(232,178,77,0.75)) drop-shadow(0 0 22px rgba(139,123,240,0.5))" }}
        />
      </motion.svg>
    </div>
  );
}
