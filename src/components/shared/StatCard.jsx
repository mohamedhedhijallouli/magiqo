import React from "react";

export default function StatCard({ icon, label, value, accent = "gold" }) {
  const colors = {
    gold: "text-gold-bright border-gold-dim/40 bg-gold/10",
    arcane: "text-arcane border-arcane-dim/40 bg-arcane/10",
    emerald: "text-emerald-bright border-emerald/40 bg-emerald/10",
    ember: "text-ember-bright border-ember/40 bg-ember/10",
  };
  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${colors[accent]}`}>
      <div className="w-11 h-11 rounded-xl bg-void/40 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div className="font-rune text-2xl leading-none">{value}</div>
        <div className="text-xs text-muted mt-1">{label}</div>
      </div>
    </div>
  );
}
