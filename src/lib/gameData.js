// The four MagiQo levels replace the old separate "age group" + "difficulty"
// concepts: a player picks ONE of these at the start of a quest, and it
// simultaneously determines their age-appropriate title, the experience
// style, and which enigma_*/hint_*/mission_* content variant is shown for
// every object/animal/place in the trail.
export const LEVELS = [
  {
    value: "explorateur", labelKey: "lvl_explorateur", ageRangeKey: "lvl_explorateur_age",
    experienceKey: "lvl_explorateur_exp", emoji: "👧", color: "emerald",
  },
  {
    value: "apprenti", labelKey: "lvl_apprenti", ageRangeKey: "lvl_apprenti_age",
    experienceKey: "lvl_apprenti_exp", emoji: "🧒", color: "gold",
  },
  {
    value: "aventurier", labelKey: "lvl_aventurier", ageRangeKey: "lvl_aventurier_age",
    experienceKey: "lvl_aventurier_exp", emoji: "🧑", color: "ember",
  },
  {
    value: "expert", labelKey: "lvl_expert", ageRangeKey: "lvl_expert_age",
    experienceKey: "lvl_expert_exp", emoji: "🧔", color: "arcane",
  },
];

// Les types de parcours (Domestique, Zoologique, Archéologique, ...) sont
// désormais gérés dynamiquement en base (voir ParcoursTypes dans lib/db.js
// et ParcoursTypesManager) au lieu d'être une liste figée ici — chaque type
// est lié à une seule famille de contenu (objets, animaux, ou lieux).

export const BADGE_THRESHOLDS = {
  legendary: { minScore: 900, emoji: "🏆", color: "#F0C040" },
  gold: { minScore: 750, emoji: "🥇", color: "#FFD700" },
  silver: { minScore: 600, emoji: "🥈", color: "#C0C0C0" },
  bronze: { minScore: 0, emoji: "🥉", color: "#CD7F32" },
};

export function calculateScore(totalTimeSeconds, penaltyCount, totalSteps) {
  const baseScore = 1000;
  const timePenalty = Math.floor(totalTimeSeconds / 10);
  const errorPenalty = penaltyCount * 50;
  const stepBonus = totalSteps * 20;
  return Math.max(0, baseScore - timePenalty - errorPenalty + stepBonus);
}

export function getBadge(score) {
  if (score >= 900) return "legendary";
  if (score >= 750) return "gold";
  if (score >= 600) return "silver";
  return "bronze";
}

export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function normalizeCode(code) {
  return (code || "").trim().toUpperCase().replace(/\s+/g, "");
}
