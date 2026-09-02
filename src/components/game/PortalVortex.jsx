import React from "react";
import { motion } from "framer-motion";

// A convincing "depth" illusion built from several concentric layers moving
// at different speeds/directions — no WebGL available here, so the tunnel
// effect is faked with layered conic/radial gradients and parallax rotation,
// which reads very well at this scale.
export default function PortalVortex({ intensity = 1, size = 340 }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ perspective: 900 }}>
      {/* light spill onto the surrounding "room" — soft pools on floor/walls */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 2.6,
          height: size * 1.3,
          bottom: -size * 0.55,
          background: "radial-gradient(ellipse, rgba(139,123,240,0.22), rgba(232,178,77,0.08) 45%, transparent 72%)",
          filter: "blur(10px)",
        }}
        animate={{ opacity: [0.35 * intensity, 0.6 * intensity, 0.35 * intensity] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 1.9,
          height: size * 1.9,
          background: "radial-gradient(circle, rgba(139,123,240,0.28), transparent 68%)",
          filter: "blur(6px)",
        }}
        animate={{ opacity: [0.4 * intensity, 0.7 * intensity, 0.4 * intensity], scale: [1, 1.04, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ---- the vortex itself ---- */}
      <div className="relative" style={{ width: size, height: size, transformStyle: "preserve-3d" }}>
        {/* infinite-depth core */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, #0F0C1F 0%, #181233 18%, #211A42 34%, #3A2E6B 50%, #5C4FAE 64%, #8B7BF0 78%, #C9B8FF 90%, #F6D488 100%)",
          }}
        />

        {/* counter-rotating energy rings, each slightly smaller/faster — the "tunnel" */}
        {[
          { inset: "0%", dur: 9, dir: 1, op: 0.9 },
          { inset: "9%", dur: 7, dir: -1, op: 0.8 },
          { inset: "18%", dur: 5.5, dir: 1, op: 0.75 },
          { inset: "27%", dur: 4, dir: -1, op: 0.7 },
          { inset: "36%", dur: 2.8, dir: 1, op: 0.65 },
        ].map((ring, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              inset: ring.inset,
              background:
                "conic-gradient(from 0deg, transparent 0%, rgba(246,212,136,0.9) 8%, transparent 20%, transparent 45%, rgba(139,123,240,0.85) 55%, transparent 68%, transparent 100%)",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
              opacity: ring.op * intensity,
            }}
            animate={{ rotate: ring.dir * 360 }}
            transition={{ duration: ring.dur, repeat: Infinity, ease: "linear" }}
          />
        ))}

        {/* inner bright singularity */}
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: "42%",
            background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(246,212,136,0.7) 45%, transparent 80%)",
          }}
          animate={{ opacity: [0.6 * intensity, 1 * intensity, 0.6 * intensity], scale: [0.9, 1.08, 0.9] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* shimmering edge distortion */}
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: "-2%",
            border: "2px solid rgba(246,212,136,0.55)",
            filter: "blur(1.5px)",
          }}
          animate={{ scale: [1, 1.015, 0.99, 1], rotate: [0, 1.2, -1, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute rounded-full" style={{ inset: "-2%", border: "1px solid rgba(139,123,240,0.4)" }} />
      </div>
    </div>
  );
}
