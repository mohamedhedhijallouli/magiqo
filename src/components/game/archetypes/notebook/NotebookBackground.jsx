import React from "react";

// Alternative à StarsBackground pour les Worlds à archétype "notebook"
// (Carnet du Patrimoine, Carnet du Zoologiste) : lignes de cahier +
// coins de ruban washi, plutôt que des étoiles.
export default function NotebookBackground() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.08] text-parchment">
        {Array.from({ length: 24 }).map((_, i) => (
          <line key={i} x1="0" y1={40 + i * 34} x2="100%" y2={40 + i * 34} stroke="currentColor" strokeWidth="1" />
        ))}
        <line x1="64" y1="0" x2="64" y2="100%" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      </svg>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.35) 100%)" }}
      />
    </div>
  );
}
