// ---------------------------------------------------------------------------
// Palettes des cartes "Commandant" — voir CommanderCard.jsx.
//
// Contrairement au thème d'un World (qui appartient au PARCOURS), la palette
// d'une carte personnage appartient au PERSONNAGE lui-même : où que ce
// personnage soit utilisé (quel que soit le parcours, quel que soit son
// World), sa carte garde toujours la même identité visuelle. C'est le choix
// fait avec l'utilisateur — voir la discussion sur "carte liée au
// personnage" vs "carte liée au World du parcours".
//
// Ajouter une nouvelle famille : un nouveau slug + une nouvelle entrée ici.
// Aucune famille non répertoriée ne casse rien : FAMILY_THEMES.default
// s'applique alors en repli.
// ---------------------------------------------------------------------------

export const FAMILY_THEMES = {
  carthaginois: {
    label: "Carthaginois",
    emoji: "🐘",
    bg: "15 12 10", panel: "26 20 15", border: "156 122 62",
    gold: "212 176 96", goldBright: "236 206 148",
    accent: "168 54 42", // rouge tampon / bordure d'emphase
    parchment: "236 224 200",
    fontDisplay: "'Cinzel'",
  },
  gladiateur: {
    label: "Gladiateur",
    emoji: "⚔️",
    bg: "20 12 8", panel: "34 20 14", border: "200 130 60",
    gold: "224 168 84", goldBright: "244 198 128",
    accent: "196 62 40",
    parchment: "238 220 190",
    fontDisplay: "'Cinzel'",
  },
  chinois: {
    label: "Dynastie Impériale",
    emoji: "🐉",
    bg: "16 8 8", panel: "32 14 14", border: "212 168 96",
    gold: "224 176 92", goldBright: "246 208 138",
    accent: "196 40 40", // rouge laqué
    parchment: "240 224 196",
    fontDisplay: "'Cormorant Garamond'",
  },
  default: {
    label: "Commandant",
    emoji: "🎖️",
    bg: "15 12 31", panel: "24 18 51", border: "139 123 240",
    gold: "232 178 77", goldBright: "246 212 136",
    accent: "226 103 59",
    parchment: "243 234 216",
    fontDisplay: "'Cinzel'",
  },
};

export function getFamilyTheme(slug) {
  return FAMILY_THEMES[slug] || FAMILY_THEMES.default;
}

export const CARD_FAMILIES = Object.entries(FAMILY_THEMES)
  .filter(([slug]) => slug !== "default")
  .map(([slug, t]) => ({ slug, label: t.label, emoji: t.emoji }));

// Rareté : fixe par personnage (choisie une fois par l'admin), détermine le
// nombre d'étoiles affichées. Le NIVEAU (nombre 80/85/90...), lui, est
// toujours calculé dynamiquement selon la performance du joueur sur cette
// devinette précise — voir computeCardLevel().
export const RARITIES = [
  { slug: "legendaire", label: "Légendaire", stars: 5 },
  { slug: "epique", label: "Épique", stars: 4 },
  { slug: "rare", label: "Rare", stars: 3 },
  { slug: "commune", label: "Commune", stars: 2 },
];

export function getRarity(slug) {
  return RARITIES.find((r) => r.slug === slug) || RARITIES[0];
}

// Niveau dynamique : dépend uniquement de la performance du joueur SUR
// CETTE devinette (pas du score global du parcours, qui n'est connu qu'à la
// toute fin) — sans faute ni indice utilisé -> le plus haut niveau ; une
// hésitation (indice ou une seule erreur) -> niveau intermédiaire ;
// plusieurs erreurs ou temps écoulé -> niveau de base. Correspond
// exactement aux trois exemples fournis (80 / 85 / 90).
export function computeCardLevel({ wrongCount = 0, hintUsed = false, timedOut = false } = {}) {
  if (timedOut || wrongCount >= 2) return 80;
  if (wrongCount === 1 || hintUsed) return 85;
  return 90;
}
