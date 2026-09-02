import React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, seal = true, ...props }) {
  return (
    <div
      className={cn(
        "relative bg-void-panel/80 backdrop-blur-sm rounded-2xl border border-void-border",
        seal && "card-seal",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("px-6 pt-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn("font-display text-xl text-gold-bright tracking-wide", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("px-6 py-6", className)} {...props}>
      {children}
    </div>
  );
}
