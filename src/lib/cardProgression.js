// ---------------------------------------------------------------------------
// Système de cartes Personnage — XP, niveau, rareté.
//
// Principe : un TYPE de parcours peut être lié à un UNIVERS de cartes. Quand
// un joueur démarre un parcours de ce type, il choisit UNE carte dans cet
// univers (voir ChooseCardScreen.jsx). Cette carte gagne de l'XP à la fin du
// parcours selon le temps économisé, ce qui la fait monter de niveau — et
// sa rareté progresse automatiquement tous les 10 niveaux.
//
// Le choix de la carte, comme le compte joueur, est UNIVERSEL : le même
// joueur (identifié par son code) retrouve son niveau sur cette carte quel
// que soit le parcours ou l'organisation où il rejoue avec elle.
// ---------------------------------------------------------------------------

import { Players, PlayerCards } from "@/lib/db";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus (0/O, 1/I/L)
const MAX_XP_PER_QUEST = 10;
export const MAX_LEVEL = 100;

// ---------------------------------------------------------------------------
// Comptes joueurs (prénom + code personnel à 4 caractères, sans mot de
// passe — public visé : enfants). Recherche GLOBALE, pas de cloisonnement
// par licence : la collection appartient à l'enfant, pas à l'organisation
// qui l'a fait jouer.
// ---------------------------------------------------------------------------
export function generatePlayerCode() {
  let code = "";
  for (let i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

export async function findOrCreatePlayer({ name, code, licenseCode }) {
  if (code) {
    const matches = await Players.filter({ code: code.toUpperCase() });
    if (matches.length === 0) return { player: null, error: "code_not_found" };
    return { player: matches[0], isNew: false };
  }
  let newCode = generatePlayerCode();
  let existing = await Players.filter({ code: newCode });
  while (existing.length > 0) {
    newCode = generatePlayerCode();
    existing = await Players.filter({ code: newCode });
  }
  const player = await Players.create({ name, code: newCode, license_code: licenseCode });
  return { player, isNew: true };
}

// ---------------------------------------------------------------------------
// Rareté : un palier tous les 10 niveaux, jusqu'au rang ultime Magistuel à
// 100 (au-dessus de l'échelle habituelle, pas un simple 11ᵉ palier de 10).
// ---------------------------------------------------------------------------
export const RARITY_TIERS = [
  { min: 0, max: 9, slug: "novice", label: "Novice", emoji: "⚪" },
  { min: 10, max: 19, slug: "eclaireur", label: "Éclaireur", emoji: "🟢" },
  { min: 20, max: 29, slug: "explorateur", label: "Explorateur", emoji: "🔵" },
  { min: 30, max: 39, slug: "conquerant", label: "Conquérant", emoji: "🟣" },
  { min: 40, max: 49, slug: "maitre", label: "Maître", emoji: "🟠" },
  { min: 50, max: 59, slug: "legende", label: "Légende", emoji: "🔴" },
  { min: 60, max: 69, slug: "mythique", label: "Mythique", emoji: "💠" },
  { min: 70, max: 79, slug: "ascendant", label: "Ascendant", emoji: "💎" },
  { min: 80, max: 89, slug: "transcendant", label: "Transcendant", emoji: "🌌" },
  { min: 90, max: 99, slug: "infini", label: "Infini", emoji: "♾️" },
  { min: 100, max: 100, slug: "magistuel", label: "Magistuel", emoji: "🌠" },
];

export function rarityForLevel(level) {
  return RARITY_TIERS.find((t) => level >= t.min && level <= t.max) || RARITY_TIERS[0];
}

// XP gagnés = (Temps prévu − Temps réalisé) ÷ (Temps prévu ÷ 10), plafonné
// entre 0 et 10 — un parcours vaut toujours 10 XP maximum, quelle que soit
// sa durée prévue. Terminer plus vite que prévu rapporte des XP ; terminer
// pile au temps prévu (ou plus lentement) n'en rapporte aucun — jamais de
// XP négatif.
export function computeXpGained(plannedSeconds, actualSeconds) {
  if (!plannedSeconds || plannedSeconds <= 0) return 0;
  const secondsPerXp = plannedSeconds / MAX_XP_PER_QUEST;
  const raw = (plannedSeconds - actualSeconds) / secondsPerXp;
  return Math.max(0, Math.min(MAX_XP_PER_QUEST, Math.round(raw)));
}

// ---------------------------------------------------------------------------
// Progression d'une carte pour un joueur donné — recherche GLOBALE (pas de
// cloisonnement par licence), cohérent avec les comptes joueurs.
// ---------------------------------------------------------------------------
export async function applyXpToCard({ playerId, cardId, xpGained, licenseCode, cardMeta }) {
  const existingRows = await PlayerCards.filter({ player_id: playerId, card_id: cardId });
  const existing = existingRows[0];
  const previousLevel = existing?.level || 0;
  const newLevel = Math.min(MAX_LEVEL, previousLevel + xpGained);

  if (!existing) {
    const created = await PlayerCards.create({
      player_id: playerId, card_id: cardId, license_code: licenseCode,
      level: newLevel, xp_total: xpGained,
      card_name: cardMeta?.name, card_illustration: cardMeta?.illustration_url,
    });
    return { card: created, previousLevel: 0, newLevel, xpGained };
  }

  const updated = await PlayerCards.update(existing.id, {
    level: newLevel,
    xp_total: (existing.xp_total || existing.level || 0) + xpGained,
  });
  return { card: updated, previousLevel, newLevel, xpGained };
}

export async function getPlayerCollection({ playerId }) {
  return PlayerCards.filter({ player_id: playerId }, "-updated_date");
}
