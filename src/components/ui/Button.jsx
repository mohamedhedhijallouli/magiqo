import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary:
    "bg-gradient-to-b from-gold-bright to-gold text-void font-bold shadow-seal hover:brightness-110",
  arcane:
    "bg-gradient-to-b from-arcane to-arcane-dim text-white font-bold shadow-glow hover:brightness-110",
  ghost:
    "bg-white/5 text-parchment border-2 border-void-border hover:bg-white/10 hover:border-gold-dim",
  danger:
    "bg-ember/20 text-ember-bright border-2 border-ember/50 hover:bg-ember/30",
  link: "text-arcane hover:text-gold underline-offset-4 hover:underline",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-base rounded-xl",
  lg: "px-8 py-4 text-lg rounded-2xl",
};

const motionCache = new Map();
function getMotionComponent(Comp) {
  if (Comp === "button") return motion.button;
  if (!motionCache.has(Comp)) {
    motionCache.set(Comp, motion.create ? motion.create(Comp) : motion(Comp));
  }
  return motionCache.get(Comp);
}

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) {
  const MotionComp = useMemo(() => getMotionComponent(Comp), [Comp]);
  return (
    <MotionComp
      whileHover={{ scale: 1.045, rotate: -0.5 }}
      whileTap={{ scale: 0.94, rotate: 0.5 }}
      transition={{ type: "spring", stiffness: 420, damping: 15 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-body transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none select-none",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </MotionComp>
  );
}
