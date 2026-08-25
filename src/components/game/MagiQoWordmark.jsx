import React from "react";
import { motion } from "framer-motion";

export default function MagiQoWordmark({ scale = 1 }) {
  return (
    <div className="flex flex-col items-center select-none" style={{ transform: `scale(${scale})` }}>
      {/* Medallion with the M rune */}
      <div className="relative w-24 h-24 mb-1">
        <motion.svg
          viewBox="0 0 100 100"
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        >
          <polygon
            points="50,3 91,26 91,74 50,97 9,74 9,26"
            fill="none"
            stroke="url(#wm-seal-grad)"
            strokeWidth="1.4"
            opacity="0.7"
          />
          <polygon
            points="50,10 84,29 84,71 50,90 16,71 16,29"
            fill="none"
            stroke="url(#wm-seal-grad)"
            strokeWidth="0.6"
            opacity="0.4"
          />
          <defs>
            <linearGradient id="wm-seal-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8B7BF0" />
              <stop offset="1" stopColor="#E8B24D" />
            </linearGradient>
          </defs>
        </motion.svg>
        <svg viewBox="0 0 64 64" className="absolute inset-0 m-auto w-16 h-16 drop-shadow-[0_0_14px_rgba(232,178,77,0.55)]">
          <circle cx="32" cy="32" r="29" fill="#181233" stroke="#E8B24D" strokeWidth="1.5" />
          <motion.path
            d="M18 41 L18 23 L32 35 L46 23 L46 41"
            fill="none"
            stroke="#F6D488"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
          <motion.circle
            cx="32"
            cy="15"
            r="2.6"
            fill="#8B7BF0"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
        </svg>
      </div>

      {/* MAGIQO wordmark with a magnifying-glass lens over the Q */}
      <div className="relative">
        <h1 className="font-display font-semibold tracking-wide text-5xl sm:text-6xl text-gradient-gold leading-none">
          MAGI<span className="relative inline-block">Q</span>O
        </h1>

        {/* Lens overlay, positioned over the Q */}
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: "1.15em",
            height: "1.15em",
            right: "0.62em",
            top: "-0.02em",
            fontSize: "1em",
            background:
              "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), rgba(139,123,240,0.25) 45%, rgba(232,178,77,0.15) 75%, transparent 100%)",
            border: "2px solid rgba(246,212,136,0.85)",
            boxShadow: "0 0 18px rgba(232,178,77,0.55), inset 0 0 12px rgba(139,123,240,0.4)",
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* lens handle */}
          <span
            className="absolute rounded-full"
            style={{
              width: "0.14em",
              height: "0.55em",
              background: "linear-gradient(180deg, #F6D488, #9C7A38)",
              right: "-0.06em",
              bottom: "-0.42em",
              transform: "rotate(45deg)",
              transformOrigin: "top",
            }}
          />
          {/* specular highlight */}
          <span
            className="absolute rounded-full bg-white/70"
            style={{ width: "0.22em", height: "0.14em", left: "0.22em", top: "0.2em", filter: "blur(1px)" }}
          />
        </motion.div>

        {/* drifting particles */}
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-gold-bright"
            style={{ width: 4, height: 4, right: `${8 + i * 10}%`, top: "10%" }}
            animate={{ y: [-4, -22, -4], opacity: [0, 1, 0], x: [0, i % 2 ? 8 : -8, 0] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}
