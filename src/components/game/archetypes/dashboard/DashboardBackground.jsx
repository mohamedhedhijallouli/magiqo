import React from "react";

// Alternative à StarsBackground pour le World à archétype "dashboard"
// (Centre de Commandement Spatial) : grille technique + orbite animée,
// plutôt que des étoiles décoratives classiques.
export default function DashboardBackground() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden text-arcane/15">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id="dash-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dash-grid)" />
      </svg>
      <svg viewBox="0 0 200 200" className="absolute top-1/2 left-1/2 w-[420px] h-[420px] -translate-x-1/2 -translate-y-1/2 text-gold/15">
        <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1 8" />
        <circle cx="170" cy="100" r="3" fill="currentColor" />
      </svg>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(132,108,240,0.14), transparent 60%)" }}
      />
    </div>
  );
}
