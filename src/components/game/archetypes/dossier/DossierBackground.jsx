import React from "react";

// Alternative à StarsBackground pour les Worlds "dossier" (Dossier Classifié,
// Quartier Général, Dossier Prestige). Pas d'étoiles ni de particules
// magiques ici : un grain de papier + un léger vignettage, cohérent avec
// l'idée d'un dossier d'archives plutôt que d'un ciel nocturne.
export default function DossierBackground() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
      <svg width="0" height="0">
        <filter id="dossier-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0" />
        </filter>
      </svg>
      <div
        className="absolute inset-0"
        style={{ filter: "url(#dossier-grain)", opacity: 0.6, mixBlendMode: "overlay" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </div>
  );
}
