import React from "react";

// Alternative à StarsBackground pour le World à archétype "arena" (Arène
// Romaine) : arches de colisée + couronne de laurier, plutôt que des étoiles.
export default function ArenaBackground() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
      <svg className="absolute bottom-0 left-0 w-full h-2/5 text-gold-dim/15" preserveAspectRatio="none" viewBox="0 0 800 200">
        {Array.from({ length: 10 }).map((_, i) => (
          <path
            key={i}
            d={`M ${i * 82} 200 L ${i * 82} 80 A 41 41 0 0 1 ${i * 82 + 82} 80 L ${i * 82 + 82} 200`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        ))}
      </svg>
      <svg viewBox="0 0 100 100" className="absolute top-8 right-8 w-16 h-16 text-gold/25">
        <path
          d="M50 10 C30 20, 20 40, 25 60 C30 80, 45 90, 50 92 C55 90, 70 80, 75 60 C80 40, 70 20, 50 10 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(226,103,59,0.12), transparent 60%)" }}
      />
    </div>
  );
}
