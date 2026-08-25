import React from "react";

// Alternative à StarsBackground pour les Worlds à archétype "map" (Carte au
// Trésor, Carte du Capitaine, Parchemin du Royaume, City Explorer) : lignes
// topographiques + rose des vents, plutôt que des étoiles. Utilise
// `currentColor` pour hériter de la couleur du World actif (voir le wrapper
// text-arcane ci-dessous), donc aucune couleur n'est codée en dur ici.
export default function MapBackground() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden text-arcane/25">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {/* Lignes topographiques */}
        {Array.from({ length: 7 }).map((_, i) => (
          <path
            key={i}
            d={`M -50 ${80 + i * 90} Q ${200 + i * 40} ${20 + i * 70}, ${450 + i * 30} ${100 + i * 80} T ${900 + i * 20} ${90 + i * 85}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
        ))}
      </svg>

      {/* Rose des vents, coin haut-droit */}
      <svg viewBox="0 0 100 100" className="absolute top-6 right-6 w-20 h-20 text-gold/40">
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="2" fill="currentColor" />
        <path d="M50 8 L54 46 L50 50 L46 46 Z" fill="currentColor" />
        <path d="M50 92 L46 54 L50 50 L54 54 Z" fill="currentColor" opacity="0.5" />
        <path d="M8 50 L46 46 L50 50 L46 54 Z" fill="currentColor" opacity="0.5" />
        <path d="M92 50 L54 54 L50 50 L54 46 Z" fill="currentColor" opacity="0.5" />
      </svg>

      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.35) 100%)" }}
      />
    </div>
  );
}
