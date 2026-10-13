// ---------------------------------------------------------------------------
// MagiQo — couche de données Supabase.
//
// Remplace l'ancienne couche localStorage par une vraie base partagée :
// toutes les collections vivent dans UNE table Postgres polymorphe
// (`app_rows`, voir supabase/schema.sql), chaque ligne portant son nom de
// collection + un blob JSONB `data` pour ses champs métier. L'API exposée
// ici (list / filter / get / create / update / remove / bulkCreate) est
// VOLONTAIREMENT identique à l'ancienne version localStorage, pour que le
// reste de l'app n'ait pas eu à changer.
//
// Portée des données (voir supabase/README.md pour le détail) :
//   - Par défaut, list()/filter() ne sont PAS filtrés par licence : c'est
//     nécessaire pour qu'un joueur sur un autre appareil (sans contexte de
//     licence) puisse rejoindre un parcours via son code d'accès, et pour
//     que la connexion cherche un compte par email avant de connaître sa
//     licence. C'est le comportement d'origine (même en localStorage, ces
//     recherches n'étaient déjà pas filtrées).
//   - Les écrans d'administration (Admin/Parent) ajoutent explicitement
//     `license_code: getAdminActiveLicenseCode()` à leurs appels .filter()
//     pour ne voir QUE les données de leur propre organisation.
// ---------------------------------------------------------------------------

import { supabase, supabaseEnabled } from "@/lib/supabaseClient";

const NS = "magiqo:v1:"; // conservé pour les quelques préférences locales (voir plus bas)

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function nowISO() {
  return new Date().toISOString();
}

function assertSupabase() {
  if (!supabaseEnabled) {
    throw new Error(
      "Supabase n'est pas configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants). Voir supabase/README.md."
    );
  }
}

// Bus d'événements local : les composants restent réactifs aux écritures
// faites depuis CET onglet sans attendre l'aller-retour réseau, ET aux
// écritures reçues d'un autre appareil via Supabase Realtime (voir
// startRealtime() plus bas).
const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function broadcast(name) {
  listeners.forEach((fn) => fn(name));
}

// ---------------------------------------------------------------------------
// Mapping ligne Postgres <-> objet applicatif.
// Row  : { id, collection, license_code, created_date, updated_date, created_by_id, data }
// Objet: { id, created_date, updated_date, created_by_id, license_code, ...data }
// ---------------------------------------------------------------------------
function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    created_date: row.created_date,
    updated_date: row.updated_date,
    created_by_id: row.created_by_id,
    license_code: row.license_code || undefined,
    ...row.data,
  };
}
function toRow(collection, obj) {
  const { id, created_date, updated_date, created_by_id, license_code, ...data } = obj;
  return { collection, license_code: license_code || null, data };
}

function matches(row, filter) {
  return Object.entries(filter).every(([k, v]) => {
    if (v === undefined) return true;
    if (k === "license_code") {
      // Filet de sécurité pour les données créées AVANT l'introduction du
      // cloisonnement par licence (migration Supabase) : ces lignes n'ont
      // aucun license_code enregistré. Sans ce cas particulier, elles
      // deviendraient invisibles pour tout le monde dès qu'un écran filtre
      // par licence — silencieusement, sans erreur, ce qui est pire qu'un
      // plantage. On les traite comme "non réclamées" et on les montre à la
      // licence actuellement active plutôt que de les faire disparaître.
      return row.license_code === v || !row.license_code;
    }
    return row[k] === v;
  });
}
function sortRows(rows, sort) {
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  const copy = [...rows];
  copy.sort((a, b) => {
    if (a[key] < b[key]) return desc ? 1 : -1;
    if (a[key] > b[key]) return desc ? -1 : 1;
    return 0;
  });
  return copy;
}

function createCollection(name) {
  return {
    async list(sort) {
      assertSupabase();
      const { data, error } = await supabase.from("app_rows").select("*").eq("collection", name);
      if (error) throw error;
      const rows = data.map(fromRow);
      return sort ? sortRows(rows, sort) : rows;
    },

    async filter(filter = {}, sort) {
      assertSupabase();
      const { data, error } = await supabase.from("app_rows").select("*").eq("collection", name);
      if (error) throw error;
      const rows = data.map(fromRow).filter((r) => matches(r, filter));
      return sort ? sortRows(rows, sort) : rows;
    },

    async get(id) {
      assertSupabase();
      const { data, error } = await supabase
        .from("app_rows")
        .select("*")
        .eq("collection", name)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return fromRow(data);
    },

    async create(payload) {
      assertSupabase();
      const now = nowISO();
      const full = { id: uid(), created_date: now, updated_date: now, created_by_id: "local", ...payload };
      const row = { ...toRow(name, full), id: full.id, created_date: now, updated_date: now, created_by_id: "local" };
      const { data, error } = await supabase.from("app_rows").insert(row).select().single();
      if (error) throw error;
      broadcast(name);
      return fromRow(data);
    },

    async bulkCreate(list) {
      assertSupabase();
      const now = nowISO();
      const rows = list.map((payload) => {
        const full = { id: uid(), created_date: now, updated_date: now, created_by_id: "local", ...payload };
        return { ...toRow(name, full), id: full.id, created_date: now, updated_date: now, created_by_id: "local" };
      });
      const { data, error } = await supabase.from("app_rows").insert(rows).select();
      if (error) throw error;
      broadcast(name);
      return data.map(fromRow);
    },

    async update(id, patch) {
      assertSupabase();
      // Fusion en lecture-modification-écriture : `data` est un blob JSONB,
      // on ne peut pas se contenter d'un UPDATE partiel côté client sans
      // écraser les champs non modifiés.
      const { data: current, error: readErr } = await supabase
        .from("app_rows")
        .select("*")
        .eq("collection", name)
        .eq("id", id)
        .maybeSingle();
      if (readErr) throw readErr;
      if (!current) throw new Error(`${name} ${id} not found`);

      const merged = { ...current.data, ...patch };
      const nextLicense = patch.license_code !== undefined ? patch.license_code : current.license_code;
      // license_code n'est pas un champ métier : on le retire du blob s'il
      // a été inclus dans le patch, il vit dans sa propre colonne.
      delete merged.license_code;

      const { data, error } = await supabase
        .from("app_rows")
        .update({ data: merged, license_code: nextLicense || null })
        .eq("collection", name)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      broadcast(name);
      return fromRow(data);
    },

    async remove(id) {
      assertSupabase();
      const { error } = await supabase.from("app_rows").delete().eq("collection", name).eq("id", id);
      if (error) throw error;
      broadcast(name);
    },

    async clear() {
      assertSupabase();
      const { error } = await supabase.from("app_rows").delete().eq("collection", name);
      if (error) throw error;
      broadcast(name);
    },
  };
}

export const GameObjects = createCollection("game_objects");
export const Users = createCollection("users");
export const Animals = createCollection("animals");
export const AnimalTypes = createCollection("animal_types");
export const Categories = createCollection("categories");
export const Parcours = createCollection("parcours");
export const Quests = createCollection("quests");
export const Parents = createCollection("parents");
export const Places = createCollection("places");
export const PlaceTypes = createCollection("place_types");
export const ParcoursTypes = createCollection("parcours_types");
export const PlayerTickets = createCollection("player_tickets");
export const Riddles = createCollection("riddles");
export const RiddleTypes = createCollection("riddle_types");
// Comptes joueurs persistants (prénom + code personnel, sans mot de passe)
// et leur collection de cartes Personnage — voir lib/cardProgression.js.
// Aucune migration SQL nécessaire : la table polymorphe app_rows accepte
// n'importe quel nom de collection dès sa première utilisation.
export const Players = createCollection("players");
export const PlayerCards = createCollection("player_cards");
// Cartes Personnage (modèles créés par l'admin, façon Objets/Catégories) et
// leurs univers (façon Catégories d'objets) — voir lib/cardProgression.js.
export const Cards = createCollection("cards");
export const CardUniverses = createCollection("card_universes");

// ---------------------------------------------------------------------------
// Realtime — reçoit les changements faits depuis un AUTRE appareil/onglet
// et les répercute via le même bus d'événements local (`subscribe`), pour
// que les écrans déjà ouverts se rafraîchissent automatiquement, sans
// sondage. Remplace l'ancien mécanisme de synchronisation par polling
// (voir lib/sync.js, conservé pour référence mais plus utilisé par défaut).
// ---------------------------------------------------------------------------
let realtimeStarted = false;
export function startRealtime() {
  if (realtimeStarted || !supabaseEnabled) return;
  realtimeStarted = true;
  supabase
    .channel("app_rows_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "app_rows" }, (payload) => {
      const collection = payload.new?.collection || payload.old?.collection;
      if (collection) broadcast(collection);
    })
    .subscribe();
}

// ---------------------------------------------------------------------------
// Local file → base64 helper (inchangé : les photos restent stockées en
// base64 dans le champ `data` JSONB — voir supabase/README.md pour une
// piste d'amélioration future vers Supabase Storage).
// ---------------------------------------------------------------------------
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Réglages simples clé/valeur, PROPRES À CE NAVIGATEUR (pas de synchro
// multi-appareils voulue ici : préférences d'affichage, endpoints IA, etc.
// — jamais une clé API, voir lib/aiVision.js).
// ---------------------------------------------------------------------------
export function getSetting(key, fallback = null) {
  try {
    const raw = localStorage.getItem(NS + "setting:" + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function setSetting(key, value) {
  localStorage.setItem(NS + "setting:" + key, JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Admin password — reste local à ce navigateur (verrou d'accès rapide à
// l'admin sur CET appareil, distinct du compte/mot de passe Supabase).
// ---------------------------------------------------------------------------
export function getAdminPassword() {
  return localStorage.getItem(NS + "admin_password") || "987654321";
}
export function setAdminPassword(pwd) {
  localStorage.setItem(NS + "admin_password", pwd);
}

// ---------------------------------------------------------------------------
// Code de licence actif sur CET appareil — sert de clé de cloisonnement
// (license_code) pour toutes les écritures/lectures "admin". Déplacé ici
// depuis lib/auth.js (qui le réexporte pour compatibilité) afin d'éviter
// une dépendance circulaire auth.js <-> db.js.
// ---------------------------------------------------------------------------
const ADMIN_LICENSE_KEY = NS + "admin_active_license_code";
export function getAdminActiveLicenseCode() {
  return localStorage.getItem(ADMIN_LICENSE_KEY) || "";
}
export function setAdminActiveLicenseCode(code) {
  localStorage.setItem(ADMIN_LICENSE_KEY, (code || "").trim().toUpperCase());
}
export function clearAdminActiveLicenseCode() {
  localStorage.removeItem(ADMIN_LICENSE_KEY);
}
export function isNewGameMasterLicense(code) {
  const last = getAdminActiveLicenseCode();
  const clean = (code || "").trim().toUpperCase();
  return !last || last !== clean;
}

function randomCode(len = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
export function generateParentCode() {
  return "PAR-" + randomCode(4);
}
export function generateObjectId(existing = []) {
  let code;
  do {
    code = randomCode(4);
  } while (existing.includes(code));
  return code;
}
export const generatePlaceCode = generateObjectId;
export function generateAccessCode() {
  const words = ["DRAGON", "PHENIX", "GRIFFON", "LICORNE", "ELFE", "TITAN", "OGRE", "SIRENE", "GOBELIN", "FAUCON"];
  const w = words[Math.floor(Math.random() * words.length)];
  return w + Math.floor(10 + Math.random() * 89);
}
export function generateTicketCode(existing = []) {
  let code;
  do {
    code = "TIX-" + randomCode(6);
  } while (existing.includes(code));
  return code;
}

// ---------------------------------------------------------------------------
// Amorçage des taxonomies par défaut — désormais PAR LICENCE (chaque
// organisation obtient sa propre copie modifiable de ces listes, plutôt
// qu'une liste partagée globalement comme au temps du localStorage
// mono-navigateur). Amorcé au premier accès Admin d'une licence donnée.
// ---------------------------------------------------------------------------
const CATEGORY_EMOJI_MAP = {
  cuisine: "🍳", salon: "🛋️", chambre: "🛏️", salle_de_bain: "🛁", jardin: "🌷",
  garage: "🚗", bureau: "🗄️", exterieur: "🌳", electromenager: "🔌", meuble: "🪑",
  jouet: "🧸", vehicule: "🚲", sport: "⚽", musique: "🎵", livre: "📚",
  vetement: "👕", outil: "🔧", decoration: "🖼️", eclairage: "💡",
  informatique: "💻", jeu: "🎲", art: "🎨", nourriture: "🍎", boisson: "🥤",
  plante: "🪴", animal: "🐾", vaisselle: "🍽️", rangement: "📦", securite: "🔒",
  loisirs: "🎯", bricolage: "🛠️", piscine: "🏊", terrasse: "☀️", cave: "🍷",
  grenier: "📦", autre: "✨",
};
const OUTDOOR_CATEGORY_SLUGS = new Set(["jardin", "garage", "exterieur", "vehicule", "piscine", "terrasse"]);

const DEFAULT_RIDDLE_TYPES = [
  ["histoire", "🏺", "Histoire"], ["geographie", "🌍", "Géographie"], ["mathematiques", "🔢", "Mathématiques"],
  ["culture_generale", "🧠", "Culture générale"], ["sciences", "🔬", "Sciences"], ["logique", "🧩", "Logique"],
  ["francais", "🇫🇷", "Français"], ["anglais", "🇬🇧", "Anglais"], ["lettres_mots", "🔤", "Lettres / Mots"],
  ["codage", "💻", "Codage"], ["personnage", "🧑‍🎤", "Personnage"], ["fantastique", "🐉", "Fantastique"],
  ["cinematographique", "🎬", "Cinématographique"],
];
const DEFAULT_PARCOURS_TYPES = [
  ["domestique", "🏠", "Domestique", "object"], ["archeologique", "🏛️", "Archéologique", "place"],
  ["zoologique", "🦁", "Zoologique", "animal"], ["naturel", "🏞️", "Naturel", "place"],
  ["historique", "🗿", "Historique", "place"], ["botanique", "🌿", "Botanique", "place"],
  ["autre", "✨", "Autre", "object"],
];
const DEFAULT_ANIMAL_TYPES = [
  ["mammifere", "🦁", "Mammifère", true], ["oiseau", "🐦", "Oiseau", false], ["reptile", "🦎", "Reptile", false],
  ["amphibien", "🐸", "Amphibien", false], ["poisson", "🐟", "Poisson", true], ["insecte", "🐝", "Insecte", false],
  ["arachnide", "🕷️", "Arachnide", true], ["crustace", "🦀", "Crustacé", false], ["mollusque", "🐌", "Mollusque", false],
  ["ferme", "🐄", "Animal de ferme", false], ["domestique", "🐶", "Animal domestique", true],
  ["sauvage", "🐺", "Animal sauvage", false], ["marin", "🐬", "Animal marin", false], ["dinosaure", "🦕", "Dinosaure", false],
  ["fantastique", "🐉", "Animal fantastique", true],
];
const DEFAULT_PLACE_TYPES = [
  ["site_archeologique", "🏛️", "Site archéologique", false, true],
  ["monument_historique", "🗿", "Monument historique", false, false],
  ["musee", "🖼️", "Musée", true, false],
  ["element_de_site", "🧱", "Élément de site", false, false],
  ["site_naturel", "🏞️", "Site naturel", false, false],
  ["quartier_historique", "🏘️", "Quartier historique", false, false],
  ["chateau_fort", "🏰", "Château fort", false, true],
  ["autre", "📍", "Autre lieu", false, false],
];

async function seedTaxonomiesForLicense(licenseCode) {
  const [cats, animalTypes, placeTypes, parcoursTypes, riddleTypes] = await Promise.all([
    Categories.filter({ license_code: licenseCode }),
    AnimalTypes.filter({ license_code: licenseCode }),
    PlaceTypes.filter({ license_code: licenseCode }),
    ParcoursTypes.filter({ license_code: licenseCode }),
    RiddleTypes.filter({ license_code: licenseCode }),
  ]);

  if (cats.length === 0) {
    await Categories.bulkCreate(
      Object.entries(CATEGORY_EMOJI_MAP).map(([slug, emoji]) => ({
        slug, emoji, label: slug.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
        label_key: `catlbl_${slug}`, is_indoor: !OUTDOOR_CATEGORY_SLUGS.has(slug), license_code: licenseCode,
      }))
    );
  }
  if (animalTypes.length === 0) {
    await AnimalTypes.bulkCreate(
      DEFAULT_ANIMAL_TYPES.map(([slug, emoji, label, is_indoor]) => ({
        slug, emoji, label, label_key: `atlbl_${slug}`, is_indoor, license_code: licenseCode,
      }))
    );
  }
  if (placeTypes.length === 0) {
    await PlaceTypes.bulkCreate(
      DEFAULT_PLACE_TYPES.map(([slug, emoji, label, is_indoor, allows_elements]) => ({
        slug, emoji, label, label_key: `pltlbl_${slug}`, is_indoor, allows_elements, license_code: licenseCode,
      }))
    );
  }
  if (parcoursTypes.length === 0) {
    await ParcoursTypes.bulkCreate(
      DEFAULT_PARCOURS_TYPES.map(([slug, emoji, label, kind]) => ({
        slug, emoji, label, label_key: `pt_${slug}`, kind, license_code: licenseCode,
      }))
    );
  }
  if (riddleTypes.length === 0) {
    await RiddleTypes.bulkCreate(
      DEFAULT_RIDDLE_TYPES.map(([slug, emoji, label]) => ({
        slug, emoji, label, label_key: `rtlbl_${slug}`, license_code: licenseCode,
      }))
    );
  } else {
    const existingSlugs = new Set(riddleTypes.map((rt) => rt.slug));
    const missing = DEFAULT_RIDDLE_TYPES.filter(([slug]) => !existingSlugs.has(slug));
    if (missing.length > 0) {
      await RiddleTypes.bulkCreate(
        missing.map(([slug, emoji, label]) => ({ slug, emoji, label, label_key: `rtlbl_${slug}`, license_code: licenseCode }))
      );
    }
  }
}

// Appelé une fois au démarrage de l'app (voir App.jsx). N'amorce des
// taxonomies QUE si une licence est déjà active sur cet appareil.
export async function seedDatabase() {
  if (!supabaseEnabled) return;
  const licenseCode = getAdminActiveLicenseCode();
  if (!licenseCode) return;
  try {
    await seedTaxonomiesForLicense(licenseCode);
  } catch (e) {
    console.error("Échec de l'amorçage des données par défaut :", e);
  }
}

// ---------------------------------------------------------------------------
// `Parcours.object_ids` peut référencer des ID de GameObjects, Animals ou
// Places indifféremment. Recherche GLOBALE (voir note en tête de fichier) :
// un joueur doit pouvoir résoudre les étapes d'un parcours qui n'appartient
// pas à la licence active sur son appareil (ou à aucune licence du tout).
// ---------------------------------------------------------------------------
export async function resolveStops(ids) {
  const [objects, animals, places] = await Promise.all([GameObjects.list(), Animals.list(), Places.list()]);
  const byId = new Map();
  objects.forEach((o) => byId.set(o.id, { ...o, _kind: "object" }));
  animals.forEach((a) => byId.set(a.id, { ...a, _kind: "animal" }));
  places.forEach((p) => byId.set(p.id, { ...p, _kind: "place" }));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

export async function resolveRiddles(ids = []) {
  const all = await Riddles.list();
  const byId = new Map(all.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

const ALL_COLLECTIONS = ["game_objects", "animals", "animal_types", "categories", "parcours", "parcours_types", "quests", "parents", "places", "place_types", "users", "player_tickets", "riddles", "riddle_types", "players", "player_cards", "cards", "card_universes"];
const PRESERVED_ON_RESET = ["parcours_types", "categories", "animal_types", "place_types", "riddle_types", "card_universes"];
const GAME_DATA_COLLECTIONS = ALL_COLLECTIONS.filter((c) => !PRESERVED_ON_RESET.includes(c));
const COLLECTION_REFS = {
  game_objects: GameObjects, animals: Animals, animal_types: AnimalTypes, categories: Categories,
  parcours: Parcours, parcours_types: ParcoursTypes, quests: Quests, parents: Parents,
  places: Places, place_types: PlaceTypes, users: Users, player_tickets: PlayerTickets,
  riddles: Riddles, riddle_types: RiddleTypes, players: Players, player_cards: PlayerCards,
  cards: Cards, card_universes: CardUniverses,
};

// Export/Import : désormais scopés à la licence active (exporte/restaure
// UNE organisation, pas la base entière). Format compatible avec les
// sauvegardes créées du temps du localStorage.
export async function exportAllData() {
  const licenseCode = getAdminActiveLicenseCode();
  const dump = { version: 1, exported_at: nowISO(), collections: {}, settings: {} };
  await Promise.all(
    ALL_COLLECTIONS.map(async (c) => {
      dump.collections[c] = licenseCode ? await COLLECTION_REFS[c].filter({ license_code: licenseCode }) : [];
    })
  );
  dump.settings.admin_password = localStorage.getItem(NS + "admin_password") || "";
  return dump;
}

export async function importAllData(dump) {
  const licenseCode = getAdminActiveLicenseCode();
  const collections = dump && dump.collections ? dump.collections : dump || {};
  for (const name of ALL_COLLECTIONS) {
    if (!Array.isArray(collections[name])) continue;
    const existing = licenseCode ? await COLLECTION_REFS[name].filter({ license_code: licenseCode }) : [];
    await Promise.all(existing.map((row) => COLLECTION_REFS[name].remove(row.id)));
    const toInsert = collections[name].map((row) => {
      const { id, created_date, updated_date, created_by_id, ...rest } = row;
      return { ...rest, license_code: licenseCode || row.license_code };
    });
    if (toInsert.length > 0) await COLLECTION_REFS[name].bulkCreate(toInsert);
  }
  if (dump?.settings?.admin_password) {
    localStorage.setItem(NS + "admin_password", dump.settings.admin_password);
  }
}

// Réinitialise les données de JEU de la licence active, en conservant les
// taxonomies partagées et le mot de passe d'administration.
export async function resetGameData() {
  const licenseCode = getAdminActiveLicenseCode();
  if (!licenseCode) return;
  for (const name of GAME_DATA_COLLECTIONS) {
    const rows = await COLLECTION_REFS[name].filter({ license_code: licenseCode });
    await Promise.all(rows.map((r) => COLLECTION_REFS[name].remove(r.id)));
  }
  await seedTaxonomiesForLicense(licenseCode);
  GAME_DATA_COLLECTIONS.forEach(broadcast);
}

// Réinitialisation totale de la licence active (y compris les taxonomies).
export async function resetAllData() {
  const licenseCode = getAdminActiveLicenseCode();
  if (!licenseCode) return;
  for (const name of ALL_COLLECTIONS) {
    const rows = await COLLECTION_REFS[name].filter({ license_code: licenseCode });
    await Promise.all(rows.map((r) => COLLECTION_REFS[name].remove(r.id)));
  }
  await seedTaxonomiesForLicense(licenseCode);
  ALL_COLLECTIONS.forEach(broadcast);
}
