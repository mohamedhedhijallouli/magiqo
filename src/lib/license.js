// ---------------------------------------------------------------------------
// MagiQo — local license system (V22).
// ---------------------------------------------------------------------------

const NS = "magiqo:v1:";
const DEFAULT_SECRET = "magiqo-local-secret-change-me";

export function getSecret() {
  return localStorage.getItem(NS + "license_secret") || DEFAULT_SECRET;
}
export function setSecret(secret) {
  localStorage.setItem(NS + "license_secret", secret);
}

async function hmacSha256(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function base36(n, length) {
  return n.toString(36).toUpperCase().padStart(length, "0").slice(-length);
}

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomChars(length) {
  let out = "";
  for (let i = 0; i < length; i++) out += CHARS[Math.floor(Math.random() * CHARS.length)];
  return out;
}
function uid() {
  return "lic-" + Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// Langues d'une licence — chaque licence embarque 1 ou plusieurs langues,
// encodées sous forme de bitmask (2 caractères base36) directement dans le
// code, au même titre que l'expiration / les joueurs / les tuteurs.
// ---------------------------------------------------------------------------
export const ALL_LICENSE_LANGUAGES = ["FR", "EN", "ES", "TN", "ZH", "RU"];
// Valeur sentinelle utilisée pour représenter "illimité" pour le nombre de
// joueurs / tuteurs d'une licence forfaitaire (doit tenir sur 2 caractères
// base36 comme les autres champs encodés dans le code : 999 → "RR").
export const UNLIMITED_SENTINEL = 999;
export function isUnlimited(n) {
  return Number(n) >= UNLIMITED_SENTINEL;
}

function normalizeLanguages(languages) {
  const list = Array.isArray(languages) ? languages : [languages];
  const cleaned = list
    .map((l) => (l || "").toString().toUpperCase().slice(0, 2))
    .filter((l) => ALL_LICENSE_LANGUAGES.includes(l));
  const unique = [...new Set(cleaned)];
  return unique.length > 0 ? unique : ["FR"];
}

function languagesToMask(languages) {
  return normalizeLanguages(languages).reduce((mask, code) => {
    const bit = ALL_LICENSE_LANGUAGES.indexOf(code);
    return bit === -1 ? mask : mask | (1 << bit);
  }, 0);
}

function maskToLanguages(mask) {
  const codes = ALL_LICENSE_LANGUAGES.filter((_, i) => (mask & (1 << i)) !== 0);
  return codes.length > 0 ? codes : ["FR"];
}

// ---------------------------------------------------------------------------
// Tarifs & saisons — configurables depuis l'onglet "Tarifs & Saisons" du
// Maître des Maîtres. Les dates de saison restent fixes, mais tous les
// montants (prix de saison, prix par jour/joueur/tuteur/langue) sont
// modifiables et persistés en localStorage.
// ---------------------------------------------------------------------------
const DEFAULT_PRICING = {
  seasonBasse: 200,
  seasonMoyenne: 400,
  seasonHaute: 600,
  pricePerDay: 1,
  pricePerPlayer: 1,
  pricePerTutor: 1,
  // La 1ère langue d'une licence est toujours gratuite ; chaque langue
  // supplémentaire est facturée à ce tarif.
  pricePerExtraLanguage: 50,
  // Licence forfaitaire (V22) : validité 1 an, joueurs & tuteurs illimités.
  // Prix fixe, indépendant des jours/joueurs/tuteurs (qui n'ont plus de
  // sens dans ce cas) — seules les langues supplémentaires restent facturées.
  forfaitPrice: 1500,
};

export function getPricingSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(NS + "pricing_settings") || "null");
    return { ...DEFAULT_PRICING, ...(raw || {}) };
  } catch {
    return { ...DEFAULT_PRICING };
  }
}
export function setPricingSettings(settings) {
  const merged = { ...getPricingSettings(), ...settings };
  localStorage.setItem(NS + "pricing_settings", JSON.stringify(merged));
  return merged;
}
export function resetPricingSettings() {
  localStorage.removeItem(NS + "pricing_settings");
  return { ...DEFAULT_PRICING };
}

/**
 * Détermine la saison et le prix de base selon la date
 * 🟢 Basse saison (1er nov - 31 mars)
 * 🟠 Moyenne saison (1er avr - 30 juin & 1er sept - 31 oct)
 * 🔴 Haute saison (1er juil - 31 août)
 * Les montants proviennent des tarifs configurés (voir getPricingSettings).
 */
export function getSeasonInfo(dateInput = new Date()) {
  const date = new Date(dateInput);
  const month = date.getMonth(); // 0 = Janvier, 11 = Décembre
  const pricing = getPricingSettings();

  if ([10, 11, 0, 1, 2].includes(month)) {
    return { season: "basse", label: "Basse saison 🟢", basePrice: pricing.seasonBasse };
  }
  if ([6, 7].includes(month)) {
    return { season: "haute", label: "Haute saison 🔴", basePrice: pricing.seasonHaute };
  }
  return { season: "moyenne", label: "Moyenne saison 🟠", basePrice: pricing.seasonMoyenne };
}

/**
 * Calcule le prix final de la licence en TND
 * Formule standard : Licence saisonnière + jours + joueurs + tuteurs +
 * langues supplémentaires (la 1ère langue est incluse gratuitement).
 * Formule forfaitaire : prix fixe + langues supplémentaires uniquement
 * (jours/joueurs/tuteurs sont illimités, donc non facturés à l'unité).
 */
export function calculateLicensePrice({ days = 30, maxPlayers = 10, maxTutors = 2, languages = ["FR"], startDate = new Date(), licenseType = "standard" } = {}) {
  const seasonInfo = getSeasonInfo(startDate);
  const pricing = getPricingSettings();
  const langCount = normalizeLanguages(languages).length;
  const extraLanguages = Math.max(0, langCount - 1);
  const languagesPrice = extraLanguages * pricing.pricePerExtraLanguage;

  if (licenseType === "forfaitaire") {
    return {
      seasonInfo, pricing, langCount, extraLanguages, languagesPrice,
      totalPriceTND: pricing.forfaitPrice + languagesPrice,
    };
  }

  const total =
    seasonInfo.basePrice +
    Number(days) * pricing.pricePerDay +
    Number(maxPlayers) * pricing.pricePerPlayer +
    Number(maxTutors) * pricing.pricePerTutor +
    languagesPrice;

  return {
    seasonInfo,
    pricing,
    langCount,
    extraLanguages,
    languagesPrice,
    totalPriceTND: total,
  };
}

// Generates a license code embedding expiry, capacity limits, languages & signature.
//
// IMPORTANT (V22) : les langues sont désormais un ENSEMBLE (1 ou plusieurs),
// encodées sous forme de bitmask signé dans le code au même titre que
// l'expiration / les joueurs / les tuteurs (la version précédente n'avait
// qu'une langue unique). La validation reste possible sur n'importe quel
// appareil, sans dépendre du localStorage du poste qui a généré la licence.
export async function generateLicense({
  length = 16,
  method = "hmac",
  days = 30,
  label = "",
  email = "",
  maxPlayers = 10,
  maxTutors = 2,
  languages = ["FR"],
  startDate = new Date(),
  licenseType = "standard",
} = {}) {
  // Licence forfaitaire (V22) : validité fixée à 1 an, joueurs et tuteurs
  // illimités (sentinelle UNLIMITED_SENTINEL), quels que soient les
  // paramètres reçus — évite toute incohérence entre le formulaire et le
  // type de licence choisi.
  const effectiveDays = licenseType === "forfaitaire" ? 365 : days;
  const effectiveMaxPlayers = licenseType === "forfaitaire" ? UNLIMITED_SENTINEL : maxPlayers;
  const effectiveMaxTutors = licenseType === "forfaitaire" ? UNLIMITED_SENTINEL : maxTutors;

  const { seasonInfo, totalPriceTND, langCount, extraLanguages, languagesPrice } = calculateLicensePrice({
    days: effectiveDays, maxPlayers: effectiveMaxPlayers, maxTutors: effectiveMaxTutors, languages, startDate, licenseType,
  });

  // L'expiration est arrondie à la seconde dès la génération, car c'est la
  // précision réellement encodée dans le code (7 caractères base36 de
  // secondes). Signer la valeur en millisecondes puis en re-dériver une
  // version arrondie à la validation ferait échouer la vérification de
  // signature presque à chaque fois.
  const expiresAt = Math.floor((Date.now() + effectiveDays * 86400000) / 1000) * 1000;
  const normalizedLanguages = normalizeLanguages(languages);
  const langMask = languagesToMask(normalizedLanguages);
  const playersNum = Math.max(0, Math.min(1295, Math.round(Number(effectiveMaxPlayers) || 0)));
  const tutorsNum = Math.max(0, Math.min(1295, Math.round(Number(effectiveMaxTutors) || 0)));

  // Empreinte signée : n'inclut plus le `label` (purement décoratif) afin
  // que la validation soit possible sans avoir accès à l'enregistrement
  // d'origine — seule la partie qui conditionne réellement l'accès au jeu
  // (expiration, joueurs, tuteurs, langues) est signée.
  const payload = `${expiresAt}:${playersNum}:${tutorsNum}:${langMask}`;

  let code;
  if (method === "checksum") {
    const body = randomChars(Math.max(4, length - 4));
    const sum = Array.from(body).reduce((a, c) => a + c.charCodeAt(0), 0);
    code = `${body}${base36(sum, 4)}`;
  } else {
    const secret = getSecret();
    const sig = await hmacSha256(payload, secret);
    const expiryPart = base36(Math.floor(expiresAt / 1000), 7);
    const langPart = base36(langMask, 2);
    const playersPart = base36(playersNum, 2);
    const tutorsPart = base36(tutorsNum, 2);
    const fixed = `${expiryPart}${langPart}${playersPart}${tutorsPart}`; // 13 caractères, toujours présents
    const sigLen = Math.max(4, length - fixed.length);
    const sigPart = sig.slice(0, sigLen).toUpperCase();
    code = `${fixed}${sigPart}`;
  }

  return {
    id: uid(),
    code,
    method: method === "checksum" ? "checksum" : "hmac",
    expiresAt,
    days: Number(effectiveDays),
    label,
    email: email ? email.trim().toLowerCase() : "",
    maxPlayers: playersNum,
    maxTutors: tutorsNum,
    languages: normalizedLanguages,
    langCount,
    extraLanguages,
    languagesPrice,
    licenseType,
    seasonPrice: seasonInfo.basePrice,
    seasonName: seasonInfo.label,
    priceTND: totalPriceTND,
    status: "active", // active | suspended
    created_at: Date.now(),
  };
}

async function validateHmacLicense(code) {
  if (!code || code.length < 8) return { valid: false, reason: "format" };
  const clean = code.trim().toUpperCase();

  const expiryPart = clean.slice(0, 7);
  const expiresAtSeconds = parseInt(expiryPart, 36);
  if (!expiresAtSeconds) return { valid: false, reason: "format" };
  const expiresAt = expiresAtSeconds * 1000;

  // Format V22 : langues (bitmask) / joueurs / tuteurs encodés + signés
  // dans le code. Fonctionne sur n'importe quel appareil, sans dépendre du
  // localStorage.
  if (clean.length >= 17) {
    const langPart = clean.slice(7, 9);
    const playersPart = clean.slice(9, 11);
    const tutorsPart = clean.slice(11, 13);
    const sigPart = clean.slice(13);
    const langMask = parseInt(langPart, 36);
    const maxPlayers = parseInt(playersPart, 36);
    const maxTutors = parseInt(tutorsPart, 36);
    const looksLikeV22 =
      !Number.isNaN(langMask) && langMask > 0 && langMask < 64 &&
      !Number.isNaN(maxPlayers) && !Number.isNaN(maxTutors);

    if (looksLikeV22) {
      // Un code de cette forme ne peut être qu'un code V22 (ou une saisie
      // erronée) : on tranche ici plutôt que de retomber sur le format
      // hérité, qui accepterait n'importe quelle signature invalide.
      const payload = `${expiresAt}:${maxPlayers}:${maxTutors}:${langMask}`;
      const sig = await hmacSha256(payload, getSecret());
      const expectedSig = sig.slice(0, sigPart.length).toUpperCase();
      if (expectedSig !== sigPart) return { valid: false, reason: "signature" };
      if (Date.now() > expiresAt) return { valid: false, reason: "expired", expiresAt };
      return { valid: true, expiresAt, maxPlayers, maxTutors, languages: maskToLanguages(langMask) };
    }
  }

  // Format hérité (licences émises avant ce correctif) : seule l'expiration
  // était encodée dans le code ; les autres règles sont reprises depuis
  // l'enregistrement stocké localement (voir validateAnyLicense), avec les
  // valeurs par défaut historiques en secours pour ne pas casser les codes
  // déjà distribués.
  if (Date.now() > expiresAt) return { valid: false, reason: "expired", expiresAt };
  return { valid: true, expiresAt };
}

const TRIAL_CODE = "191172sfax";
const TRIAL_DAYS = 7;

export function validateTrialCode(code) {
  if (code.trim().toLowerCase() !== TRIAL_CODE.toLowerCase()) return { valid: false, reason: "not_trial" };
  const key = NS + "trial_first_used";
  let firstUsed = localStorage.getItem(key);
  if (!firstUsed) {
    firstUsed = Date.now().toString();
    localStorage.setItem(key, firstUsed);
  }
  const expiresAt = parseInt(firstUsed, 10) + TRIAL_DAYS * 86400000;
  if (Date.now() > expiresAt) return { valid: false, reason: "expired", expiresAt };
  return { valid: true, expiresAt, trial: true, maxPlayers: 5, maxTutors: 1, languages: ["FR"] };
}

export function getStoredLicenses() {
  try {
    return JSON.parse(localStorage.getItem(NS + "licenses") || "[]");
  } catch {
    return [];
  }
}
function saveStoredLicenses(list) {
  localStorage.setItem(NS + "licenses", JSON.stringify(list.slice(0, 500)));
}
export function storeLicense(entry) {
  const list = getStoredLicenses();
  list.unshift(entry);
  saveStoredLicenses(list);
}
export function setLicenseStatus(id, status) {
  const list = getStoredLicenses().map((l) => (l.id === id ? { ...l, status } : l));
  saveStoredLicenses(list);
}
export function deleteLicenseById(id) {
  saveStoredLicenses(getStoredLicenses().filter((l) => l.id !== id));
}
export function findStoredLicenseByCode(code) {
  return getStoredLicenses().find((l) => l.code.toLowerCase() === code.trim().toLowerCase()) || null;
}
export function updateStoredLicense(id, patch) {
  const list = getStoredLicenses().map((l) => (l.id === id ? { ...l, ...patch } : l));
  saveStoredLicenses(list);
}

// Codes révoqués (V22) : quand une licence est modifiée (langues, joueurs,
// tuteurs, jours...), un NOUVEAU code signé est généré pour remplacer
// l'ancien — mais l'ancien code reste, en théorie, toujours vérifiable
// cryptographiquement (il porte sa propre signature). On maintient donc une
// liste de révocation explicite pour empêcher un ancien code modifié de
// continuer à fonctionner.
function getRevokedCodes() {
  try {
    return JSON.parse(localStorage.getItem(NS + "revoked_codes") || "[]");
  } catch {
    return [];
  }
}
export function revokeCode(code) {
  const list = getRevokedCodes();
  const clean = (code || "").trim().toUpperCase();
  if (!list.includes(clean)) {
    list.unshift(clean);
    localStorage.setItem(NS + "revoked_codes", JSON.stringify(list.slice(0, 1000)));
  }
}
function isCodeRevoked(code) {
  return getRevokedCodes().includes((code || "").trim().toUpperCase());
}

export async function validateAnyLicense(code, email = "") {
  const trial = validateTrialCode(code);
  if (trial.valid || trial.reason === "expired") {
    if (trial.valid) {
      return {
        ...trial,
        maxPlayers: trial.maxPlayers ?? 10,
        maxTutors: trial.maxTutors ?? 2,
        languages: trial.languages || ["FR"],
      };
    }
    return trial;
  }

  if (isCodeRevoked(code)) {
    return { valid: false, reason: "revoked" };
  }

  const crypto_check = await validateHmacLicense(code);
  if (!crypto_check.valid) return crypto_check;

  const stored = findStoredLicenseByCode(code);
  if (stored) {
    if (stored.status === "suspended") return { valid: false, reason: "suspended" };
    if (stored.email && email && stored.email.toLowerCase() !== email.trim().toLowerCase()) {
      return { valid: false, reason: "email_mismatch" };
    }
    if (stored.email && !email) {
      return { valid: false, reason: "email_mismatch" };
    }
  }

  // Priorité aux valeurs décodées et signées dans le code lui-même
  // (format V22) : elles restent correctes même sur un appareil qui n'a
  // jamais "vu" cette licence auparavant. On ne retombe sur l'enregistrement
  // stocké localement / les valeurs par défaut que pour les codes hérités
  // qui n'embarquent pas encore ces informations.
  const storedLanguages = stored?.languages || (stored?.language ? [stored.language] : null);
  return {
    ...crypto_check,
    valid: true,
    maxPlayers: Number(crypto_check?.maxPlayers ?? stored?.maxPlayers ?? 10),
    maxTutors: Number(crypto_check?.maxTutors ?? stored?.maxTutors ?? 2),
    languages: crypto_check?.languages || storedLanguages || ["FR"],
    priceTND: stored?.priceTND ?? crypto_check?.priceTND ?? 0,
    licenseType: stored?.licenseType || "standard",
    label: stored?.label || crypto_check?.label || "Licence V22",
  };
}