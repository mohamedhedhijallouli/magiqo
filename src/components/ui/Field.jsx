import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Label({ className, children, ...props }) {
  return (
    <label className={cn("block text-sm font-semibold text-muted mb-1.5", className)} {...props}>
      {children}
    </label>
  );
}

const fieldBase =
  "w-full px-4 py-2.5 rounded-xl bg-void-panel2 border-2 border-void-border text-parchment placeholder:text-muted/50 " +
  "focus:outline-none focus:ring-4 focus:ring-arcane/30 focus:border-arcane focus:scale-[1.015] " +
  "hover:border-white/25 transition-all duration-200 ease-out";

export function Input({ className, ...props }) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(fieldBase, "resize-y min-h-[90px]", className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(fieldBase, "appearance-none pr-10 cursor-pointer", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-gold"
      />
    </div>
  );
}

export function Switch({ checked, onChange, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0",
        checked ? "bg-emerald shadow-[0_0_12px_rgba(63,184,138,0.5)]" : "bg-void-border",
        className
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}
