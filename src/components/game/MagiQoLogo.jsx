import React from "react";
import { motion } from "framer-motion";

export default function MagiQoLogo({ size = 96, spin = true }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {spin && (
        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        >
          <polygon
            points="50,4 90,27 90,73 50,96 10,73 10,27"
            fill="none"
            stroke="url(#seal-grad)"
            strokeWidth="1.5"
            opacity="0.55"
          />
          <defs>
            <linearGradient id="seal-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8B7BF0" />
              <stop offset="1" stopColor="#E8B24D" />
            </linearGradient>
          </defs>
        </motion.svg>
      )}
      <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 64 64" className="relative drop-shadow-[0_0_12px_rgba(232,178,77,0.5)]">
        <circle cx="32" cy="32" r="30" fill="#181233" stroke="#E8B24D" strokeWidth="1.5" />
        <path
          d="M20 40 L20 24 L32 34 L44 24 L44 40"
          fill="none"
          stroke="#F6D488"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="18" r="2.4" fill="#8B7BF0" />
      </svg>
    </div>
  );
}
