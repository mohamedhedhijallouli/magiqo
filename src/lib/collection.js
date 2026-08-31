// ---------------------------------------------------------------------------
// Comptes joueurs persistants + collection de cartes Commandant.
//
// Un joueur n'a ni email ni mot de passe (public visé : enfants) : juste un
// prénom + un code personnel court (4 caractères), qu'il conserve d'une
// partie à l'autre pour retrouver sa collection. La collection est propre à
// chaque organisation (license_code) — cohérent avec le reste de l'app :
// jouer à des parcours d'organisations différentes donne des collections
// séparées.
//
// Règle de progression (choisie avec l'utilisateur) : à chaque fois qu'un
// joueur obtient une carte déjà possédée, on garde le meilleur niveau
// jamais atteint, PLUS un petit bonus de doublon (+1, plafonné à 99) — la
// carte progresse vraiment dans le temps, elle ne se contente pas de
// refléter la seule performance de la partie en cours.
// ---------------------------------------------------------------------------

import { Players, PlayerCards } from "@/lib/db";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus (0/O, 1/I/L)
const MAX_LEVEL = 99;

export function generatePlayerCode() {
  let code = "";
  for (let i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

// Identifiant stable d'un personnage, indépendant de la devinette qui le
// révèle : deux devinettes différentes portant "Amilcar Barca / carthaginois"
// représentent la MÊME carte dans la collection du joueur.
export function characterKeyFor(riddle) {
  const slug = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  return `${slug(riddle.card_family)}__${slug(riddle.card_name)}`;
}

// Retrouve un joueur par son code (scopé à la licence), ou en crée un
// nouveau si aucun code n'est fourni. Ne crée JAMAIS silencieusement un
// joueur si un code est fourni mais introuvable : l'appelant doit alors
// avertir clairement ("code invalide") plutôt que fusionner par erreur deux
// enfants différents.
export async function findOrCreatePlayer({ name, code, licenseCode }) {
  if (code) {
    const matches = await Players.filter({ code: code.toUpperCase(), license_code: licenseCode });
    if (matches.length === 0) return { player: null, error: "code_not_found" };
    return { player: matches[0], isNew: false };
  }

  let newCode = generatePlayerCode();
  let existing = await Players.filter({ code: newCode, license_code: licenseCode });
  // Collision extrêmement improbable (33^4 ≈ 1.19M combinaisons par
  // licence) mais on se prémunit tout de même.
  while (existing.length > 0) {
    newCode = generatePlayerCode();
    existing = await Players.filter({ code: newCode, license_code: licenseCode });
  }
  const player = await Players.create({ name, code: newCode, license_code: licenseCode });
  return { player, isNew: true };
}

// Enregistre l'obtention d'une carte pour un joueur, applique la règle de
// progression, et renvoie le résultat pour affichage ("Nouveau !" / "Niveau
// supérieur !" / niveau inchangé).
export async function recordCardObtained({ playerId, riddle, computedLevel, licenseCode }) {
  const characterKey = characterKeyFor(riddle);
  const existingRows = await PlayerCards.filter({ player_id: playerId, character_key: characterKey, license_code: licenseCode });
  const existing = existingRows[0];

  if (!existing) {
    const created = await PlayerCards.create({
      player_id: playerId,
      character_key: characterKey,
      license_code: licenseCode,
      level: computedLevel,
      times_earned: 1,
      card_name: riddle.card_name,
      card_title: riddle.card_title,
      card_family: riddle.card_family,
      card_rarity: riddle.card_rarity,
    });
    return { card: created, status: "new" };
  }

  const bestSoFar = Math.max(existing.level, computedLevel);
  const nextLevel = Math.min(MAX_LEVEL, bestSoFar + 1);
  const updated = await PlayerCards.update(existing.id, {
    level: nextLevel,
    times_earned: (existing.times_earned || 1) + 1,
  });
  return { card: updated, status: nextLevel > existing.level ? "level_up" : "unchanged" };
}

export async function getPlayerCollection({ playerId, licenseCode }) {
  const cards = await PlayerCards.filter({ player_id: playerId, license_code: licenseCode }, "-updated_date");
  return cards;
}
