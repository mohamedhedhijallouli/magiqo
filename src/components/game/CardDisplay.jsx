import React from "react";
import { rarityForLevel } from "@/lib/cardProgression";

// Affichage compact d'une carte Personnage — réutilisé dans ChooseCardScreen,
// CardXpResultScreen et CollectionModal. Design volontairement générique
// (or/void, l'identité de base de MagiQo) : contrairement à l'ancien
// système, une carte n'a plus de palette propre par famille — c'est
// l'illustration fournie par l'admin qui porte l'identité visuelle.
export default function CardDisplay({ card, level = 0, size = "md", selected, onClick }) {
  const rarity = rarityForLevel(level);
  const dims = size === "sm" ? "w-24" : size === "lg" ? "w-48" : "w-36";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`${dims} shrink-0 rounded-xl overflow-hidden border-2 transition-all text-left ${
        selected ? "border-gold shadow-glow scale-[1.03]" : "border-void-border hover:border-gold-dim"
      } ${!onClick ? "cursor-default" : "cursor-pointer"}`}
    >
      <div className="aspect-[3/4] bg-void-panel2 flex items-center justify-center relative">
        {card.illustration_url ? (
          <img src={card.illustration_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">🃏</span>
        )}
        <div className="absolute top-1.5 right-1.5 bg-void/80 border border-gold-dim/50 rounded-full px-1.5 py-0.5 text-[10px] font-rune text-gold-bright">
          {level}
        </div>
      </div>
      <div className="bg-void-panel px-2 py-1.5">
        <p className="text-xs font-semibold text-parchment truncate">{card.name}</p>
        <p className="text-[9px] flex items-center gap-1" style={{ color: "rgb(232 178 77)" }}>
          {rarity.emoji} {rarity.label}
        </p>
      </div>
    </button>
  );
}
