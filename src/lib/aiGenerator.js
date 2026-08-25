// ---------------------------------------------------------------------------
// MagiQo — local "smart generator".
// Since this local edition has no backend, this replaces the old Base44
// InvokeLLM integration with a fully offline template engine: given just a
// real name (and optionally a category/type), it invents a fantasy name,
// picks a fitting emoji, and writes a full set of enigmas/hints/missions and
// general-knowledge riddles at all four MagiQo levels (Explorateur, Apprenti
// Aventurier, Aventurier, Expert). No network call, no API key, no data
// leaves the browser. Everything it produces can still be freely edited.
// ---------------------------------------------------------------------------

function cap(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function low(s) {
  return (s || "").toLowerCase();
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function uid() {
  return "r-" + Math.random().toString(36).slice(2, 9);
}

const LEVEL_KEYS = ["explorateur", "apprenti", "aventurier", "expert"];

const COLOR_PALETTE = ["#8B7BF0", "#E8B24D", "#3FB88A", "#E2673B", "#4FC3F7", "#F06292", "#AED581", "#BA68C8", "#FFB74D", "#4DD0E1"];

const EMOJI_KEYWORDS = [
  [["frigo", "réfrigérateur", "refrigerateur"], "❄️"],
  [["four", "cuisinière", "cuisiniere"], "🔥"],
  [["micro-onde", "micro onde", "micro-ondes"], "🍲"],
  [["canapé", "canape", "sofa"], "🛋️"],
  [["fauteuil", "chaise"], "🪑"],
  [["table"], "🍽️"],
  [["lit", "matelas"], "🛏️"],
  [["armoire", "placard", "dressing"], "🚪"],
  [["lampe"], "💡"],
  [["télé", "tele", "television", "télévision"], "📺"],
  [["ordinateur", "pc "], "💻"],
  [["livre", "bibliothèque", "bibliotheque"], "📚"],
  [["jouet", "peluche"], "🧸"],
  [["vélo", "velo", "bicyclette"], "🚲"],
  [["voiture", "auto"], "🚗"],
  [["arbre"], "🌳"],
  [["fleur"], "🌷"],
  [["porte"], "🚪"],
  [["fenêtre", "fenetre"], "🪟"],
  [["miroir"], "🪞"],
  [["horloge", "pendule"], "🕰️"],
  [["piano"], "🎹"],
  [["guitare"], "🎸"],
  [["ballon"], "⚽"],
  [["piscine"], "🏊"],
  [["jardin", "pelouse"], "🌿"],
  [["poubelle"], "🗑️"],
  [["escalier"], "🪜"],
  [["tapis"], "🧶"],
  [["coussin"], "🛋️"],
  [["plante"], "🪴"],
  [["boîte aux lettres", "boite aux lettres"], "📮"],
  [["valise"], "🧳"],
  [["parapluie"], "☂️"],
  [["chapeau"], "🎩"],
  [["lunettes"], "👓"],
  [["sac"], "🎒"],
  [["tableau", "cadre"], "🖼️"],
  [["étagère", "etagere"], "📚"],
  [["cheminée", "cheminee"], "🔥"],
  [["robinet", "évier", "evier"], "🚰"],
  [["douche"], "🚿"],
  [["baignoire"], "🛁"],
  [["toilette", "wc"], "🚽"],
  [["clavier"], "⌨️"],
  [["téléphone", "telephone"], "📱"],
  [["montre"], "⌚"],
  [["bijou", "collier", "bague"], "💍"],
];

const ANIMAL_EMOJI_KEYWORDS = [
  [["chat"], "🐱"], [["chien"], "🐶"], [["poisson"], "🐟"], [["oiseau", "perroquet"], "🐦"],
  [["lapin"], "🐰"], [["tortue"], "🐢"], [["hamster"], "🐹"], [["cheval", "poney"], "🐴"],
  [["vache"], "🐄"], [["cochon"], "🐷"], [["mouton", "agneau"], "🐑"], [["poule", "coq"], "🐔"],
  [["serpent"], "🐍"], [["araignée", "araignee"], "🕷️"], [["papillon"], "🦋"], [["abeille"], "🐝"],
  [["dinosaure"], "🦕"], [["dragon"], "🐉"], [["lion"], "🦁"], [["tigre"], "🐯"], [["ours"], "🐻"],
  [["loup"], "🐺"], [["renard"], "🦊"], [["singe"], "🐵"], [["éléphant", "elephant"], "🐘"],
  [["girafe"], "🦒"], [["dauphin"], "🐬"], [["requin"], "🦈"], [["grenouille"], "🐸"],
  [["escargot"], "🐌"], [["hibou", "chouette"], "🦉"], [["licorne"], "🦄"], [["phénix", "phenix"], "🔥"],
];

function guessEmoji(realName, keywords, fallback) {
  const name = low(realName);
  for (const [words, emoji] of keywords) {
    if (words.some((w) => name.includes(w))) return emoji;
  }
  return fallback;
}

const OBJECT_TITLE_TEMPLATES = [
  (r) => `Gardien de ${cap(r)}`, (r) => `L'Esprit du ${low(r)}`, (r) => `${cap(r)} Enchanté`,
  (r) => `Le Secret du ${low(r)}`, (r) => `Sentinelle de ${low(r)}`, (r) => `${cap(r)} des Mille Sortilèges`,
  (r) => `L'Ancien ${cap(r)}`, (r) => `${cap(r)} de Cristal`, (r) => `Le Trésor Caché : ${cap(r)}`,
  (r) => `${cap(r)} Céleste`, (r) => `La Relique du ${low(r)}`, (r) => `${cap(r)} des Brumes`,
];

const ANIMAL_TITLE_TEMPLATES = [
  (r) => `${cap(r)} Mystique`, (r) => `Le Compagnon ${cap(r)}`, (r) => `${cap(r)} Légendaire`,
  (r) => `Gardien à Poils : ${cap(r)}`, (r) => `${cap(r)} des Forêts Enchantées`, (r) => `L'Esprit Animal : ${cap(r)}`,
  (r) => `${cap(r)} Enchanté(e)`, (r) => `Le Sage ${cap(r)}`, (r) => `${cap(r)} Céleste`, (r) => `Le Protecteur ${cap(r)}`,
];

const PLACE_TITLE_TEMPLATES = [
  (r) => `Les Vestiges de ${cap(r)}`, (r) => `Le Sanctuaire de ${cap(r)}`, (r) => `${cap(r)} l'Éternelle`,
  (r) => `Les Portes de ${cap(r)}`, (r) => `Le Royaume Oublié de ${cap(r)}`, (r) => `${cap(r)} des Anciens`,
  (r) => `La Cité Perdue de ${cap(r)}`, (r) => `${cap(r)}, Gardienne du Temps`,
];

const OBJECT_DESC_TEMPLATES = [
  (fn, r) => `Un(e) ${low(r)} imprégné(e) d'une magie ancienne, gardien discret des secrets du foyer.`,
  (fn, r) => `Ce ${low(r)} cache un pouvoir que seuls les vrais aventuriers savent déceler.`,
  (fn, r) => `${fn} veille silencieusement, attendant qu'un brave vienne percer son mystère.`,
  (fn, r) => `On raconte que ce ${low(r)} a traversé les âges sans jamais perdre son éclat magique.`,
  (fn, r) => `${fn} n'est pas un simple ${low(r)} : c'est une porte vers l'aventure.`,
];

const ANIMAL_DESC_TEMPLATES = [
  (fn, r) => `${fn} est un(e) ${low(r)} pas comme les autres, doté(e) d'une sagesse ancienne.`,
  (fn, r) => `Ce compagnon plein de malice cache un secret magique.`,
  (fn, r) => `${fn} veille sur la maison avec une bienveillance légendaire.`,
  (fn, r) => `On dit que ${fn} comprend le langage des étoiles.`,
];

const PLACE_DESC_TEMPLATES = [
  (fn, r) => `${r} garde entre ses pierres la mémoire d'un temps oublié.`,
  (fn, r) => `${fn} veille depuis des siècles, silencieuse et majestueuse.`,
  (fn, r) => `Peu de voyageurs savent que ${r} cache un secret ancien.`,
  (fn, r) => `On raconte que ${fn} n'a jamais fini de livrer tous ses mystères.`,
];

// -- Enigma / hint / mission banks, one per MagiQo level -------------------

const OBJECT_ENIGMA = {
  explorateur: [
    (fn, r) => `Je suis ${fn}. On me trouve près du ${low(r)}. Peux-tu me retrouver ?`,
    (fn, r) => `Cherche-moi là où se trouve le ${low(r)} de la maison. Je suis ${fn} !`,
  ],
  apprenti: [
    (fn, r) => `Je me cache sous les traits d'un(e) ${low(r)}. Sauras-tu deviner mon nom magique, ${fn} ?`,
    (fn, r) => `Un(e) ${low(r)} pas comme les autres t'attend. Trouve ${fn} !`,
  ],
  aventurier: [
    (fn, r) => `Gardien discret du quotidien, je me cache sous les traits d'un(e) ${low(r)}. Trouve mon nom magique : ${fn}.`,
    (fn, r) => `Dans l'ombre du ${low(r)}, une présence veille. Es-tu prêt à découvrir ${fn} ?`,
  ],
  expert: [
    (fn, r) => `Manifestation arcanique déguisée en simple ${low(r)}, je réclame un regard aiguisé pour être percé(e) à jour. Qui suis-je ?`,
    (fn, r) => `Les anciens m'ont nommé ${fn} ; les non-initiés ne voient en moi qu'un(e) vulgaire ${low(r)}.`,
  ],
};
const OBJECT_HINT = {
  explorateur: [(fn, r) => `Je suis dans la même pièce que le ${low(r)}.`, (fn, r) => `Regarde tout près du ${low(r)} !`],
  apprenti: [(fn, r) => `Je suis facile à trouver, cherche du côté du ${low(r)}.`, (fn, r) => `Observe ce qui entoure le ${low(r)}.`],
  aventurier: [(fn, r) => `Approche-toi du ${low(r)} et observe attentivement.`, (fn, r) => `Le ${low(r)} n'est jamais loin de moi.`],
  expert: [(fn, r) => `Une observation minutieuse près du ${low(r)} devrait suffire aux plus aguerris.`, (fn, r) => `Les indices se cachent dans les détails du ${low(r)}.`],
};
const OBJECT_MISSION = {
  explorateur: [(fn, r) => `Va toucher ${fn} et reviens en courant !`, (fn, r) => `Trouve ${fn} et fais un grand sourire !`],
  apprenti: [(fn, r) => `Approche-toi de ${fn} et compte jusqu'à 10 à voix haute.`, (fn, r) => `Découvre ${fn} et décris sa couleur.`],
  aventurier: [(fn, r) => `Photographie mentalement ${fn} et décris un détail précis.`, (fn, r) => `Approche-toi de ${fn} et note un indice pour ton équipe.`],
  expert: [(fn, r) => `Localise ${fn}, observe-le/la 10 secondes, puis décris un détail caché à ton équipe.`, (fn, r) => `Trouve ${fn} et explique en une phrase pourquoi il/elle est magique.`],
};

const ANIMAL_ENIGMA = {
  explorateur: [(fn, r) => `Je suis un(e) ${low(r)}. Saurais-tu me retrouver ?`, (fn, r) => `Cherche-moi, je suis ${fn}, un(e) ${low(r)} amical(e) !`],
  apprenti: [(fn, r) => `On me connaît sous le nom de ${fn}. Devine quel(le) ${low(r)} je suis vraiment.`, (fn, r) => `Un(e) ${low(r)} malicieux(se) se cache tout près. Trouve ${fn} !`],
  aventurier: [(fn, r) => `Créature familière au premier regard, je cache bien plus qu'un simple ${low(r)}. Qui suis-je, ${fn} ?`, (fn, r) => `On me croise souvent sans me voir vraiment : je suis ${fn}.`],
  expert: [(fn, r) => `Les naturalistes anciens m'ont surnommé ${fn} ; peu reconnaissent en moi un(e) ${low(r)} aux pouvoirs oubliés.`, (fn, r) => `Seul un regard expert distinguera en ce/cette ${low(r)} la véritable nature de ${fn}.`],
};
const ANIMAL_HINT = {
  explorateur: [(fn, r) => `Je suis un animal, cherche-moi tout près de toi !`, (fn, r) => `Regarde bien, un(e) ${low(r)} n'est jamais loin.`],
  apprenti: [(fn, r) => `Observe les alentours, ce/cette ${low(r)} aime se montrer discret(ète).`, (fn, r) => `Écoute attentivement, je pourrais faire du bruit.`],
  aventurier: [(fn, r) => `Ce/cette ${low(r)} a ses habitudes : cherche là où on s'y attend le moins.`, (fn, r) => `Un regard patient révélera ma présence.`],
  expert: [(fn, r) => `Seule une observation experte du comportement d'un(e) ${low(r)} permettra de me localiser.`, (fn, r) => `Les indices sont subtils, comme il sied à un(e) véritable ${low(r)}.`],
};
const ANIMAL_MISSION = {
  explorateur: [(fn, r) => `Trouve ${fn} et imite son cri !`, (fn, r) => `Découvre ${fn} et dis bonjour tout doucement.`],
  apprenti: [(fn, r) => `Observe ${fn} pendant 10 secondes et décris ce que tu vois.`, (fn, r) => `Trouve ${fn} et nomme sa couleur principale.`],
  aventurier: [(fn, r) => `Approche-toi de ${fn} sans le/la déranger et note un comportement typique.`, (fn, r) => `Découvre ${fn} et explique à ton équipe où tu l'as trouvé(e).`],
  expert: [(fn, r) => `Documente une caractéristique précise de ${fn} que peu remarquent.`, (fn, r) => `Localise ${fn} et déduis son rôle dans son environnement.`],
};

const PLACE_ENIGMA = {
  explorateur: [(fn, r) => `Je suis un(e) ${low(r)}. Peux-tu me retrouver sur la carte ?`, (fn, r) => `Cherche-moi : je suis un(e) ${low(r)} qui n'attend que ta visite.`],
  apprenti: [(fn, r) => `Un(e) ${low(r)} se dresse non loin. Découvre son nom magique : ${fn}.`, (fn, r) => `Une présence ancienne habite ce ${low(r)}. Sauras-tu la trouver ?`],
  aventurier: [(fn, r) => `Sur cette terre se dresse un(e) ${low(r)} millénaire. Découvre son nom magique : ${fn}.`, (fn, r) => `Une présence ancienne habite ce ${low(r)}. Es-tu prêt à découvrir ${fn} ?`],
  expert: [(fn, r) => `Vestige d'une civilisation oubliée, ce/cette ${low(r)} réclame un regard aiguisé pour révéler ses secrets. Qui suis-je ?`, (fn, r) => `Les anciens ont nommé ce lieu ${fn} ; seuls les vrais explorateurs en perçoivent la portée historique.`],
};
const PLACE_HINT = {
  explorateur: [(fn, r) => `Suis le chemin indiqué jusqu'au ${low(r)}.`, (fn, r) => `Ce lieu est facile d'accès, regarde le plan fourni.`],
  apprenti: [(fn, r) => `Approche-toi des coordonnées indiquées et observe les alentours.`, (fn, r) => `Le ${low(r)} se distingue par son architecture particulière.`],
  aventurier: [(fn, r) => `Suis les indications GPS jusqu'au ${low(r)}.`, (fn, r) => `Observe l'architecture environnante pour te repérer.`],
  expert: [(fn, r) => `Seule une lecture attentive du terrain permettra de localiser précisément ce lieu.`, (fn, r) => `Les indices historiques autour du site devraient t'orienter.`],
};
const PLACE_MISSION = {
  explorateur: [(fn, r) => `Rends-toi à ${fn} et prends une photo souvenir !`, (fn, r) => `Découvre ${fn} et raconte ce que tu vois.`],
  apprenti: [(fn, r) => `Explore ${fn} et note un détail qui t'a marqué.`, (fn, r) => `Approche-toi de ${fn} et compte les éléments visibles depuis l'entrée.`],
  aventurier: [(fn, r) => `Explore ${fn} et note un détail architectural marquant.`, (fn, r) => `Approche-toi de ${fn} et compte les éléments visibles depuis l'entrée.`],
  expert: [(fn, r) => `Explore ${fn}, identifie son époque probable et partage ta déduction avec ton équipe.`, (fn, r) => `Documente un détail caché de ${fn} que peu de visiteurs remarquent.`],
};

const RANDOM_OBJECT_NAMES = [
  "Réfrigérateur", "Four", "Canapé", "Table basse", "Lit", "Armoire", "Lampe de bureau",
  "Télévision", "Ordinateur", "Vélo", "Arbre du jardin", "Boîte aux lettres", "Piano",
  "Guitare", "Horloge murale", "Tapis du salon", "Étagère", "Miroir", "Parapluie",
  "Valise", "Chapeau", "Sac à dos", "Ballon de foot", "Cheminée", "Escalier",
  "Fenêtre du salon", "Porte d'entrée", "Coffre au trésor", "Lanterne magique", "Grimoire poussiéreux",
];

const RANDOM_ANIMAL_NAMES = [
  "Chat", "Chien", "Poisson rouge", "Perroquet", "Lapin", "Tortue", "Hamster", "Cheval",
  "Vache", "Cochon d'Inde", "Mouton", "Poule", "Papillon", "Dauphin", "Renard", "Hibou",
  "Petit dragon", "Licorne miniature", "Phénix apprivoisé", "Loup des bois",
];

function buildContent({ realName, titleTemplates, descTemplates, colorHint, emoji, enigmaBank, hintBank, missionBank }) {
  const fantasyName = pick(titleTemplates)(realName);
  const description = pick(descTemplates)(fantasyName, realName);
  const out = { fantasy_name: fantasyName, emoji, color: colorHint || pick(COLOR_PALETTE), description };
  LEVEL_KEYS.forEach((level) => {
    out[`enigma_${level}`] = pick(enigmaBank[level])(fantasyName, realName);
    out[`hint_${level}`] = pick(hintBank[level])(fantasyName, realName);
    out[`mission_${level}`] = pick(missionBank[level])(fantasyName, realName);
  });
  return out;
}

export function randomObjectRealName() {
  return pick(RANDOM_OBJECT_NAMES);
}
export function randomAnimalRealName() {
  return pick(RANDOM_ANIMAL_NAMES);
}
export function randomPlaceRealName() {
  return pick([
    "Cité antique", "Temple oublié", "Forteresse de pierre", "Amphithéâtre ancien",
    "Nécropole royale", "Pont millénaire", "Grotte sacrée", "Palais en ruines",
    "Tour de guet", "Sanctuaire de montagne",
  ]);
}

export function generateObjectContent(realName, categories = []) {
  const catInfo = categories.find((c) => low(c.label) === low(realName)) || null;
  const emoji = guessEmoji(realName, EMOJI_KEYWORDS, catInfo?.emoji || "✨");
  return buildContent({
    realName, titleTemplates: OBJECT_TITLE_TEMPLATES, descTemplates: OBJECT_DESC_TEMPLATES, emoji,
    enigmaBank: OBJECT_ENIGMA, hintBank: OBJECT_HINT, missionBank: OBJECT_MISSION,
  });
}

export function generateAnimalContent(realName, types = []) {
  const emoji = guessEmoji(realName, ANIMAL_EMOJI_KEYWORDS, "🐾");
  return buildContent({
    realName, titleTemplates: ANIMAL_TITLE_TEMPLATES, descTemplates: ANIMAL_DESC_TEMPLATES, emoji,
    enigmaBank: ANIMAL_ENIGMA, hintBank: ANIMAL_HINT, missionBank: ANIMAL_MISSION,
  });
}

export function generatePlaceContent(realName) {
  return buildContent({
    realName, titleTemplates: PLACE_TITLE_TEMPLATES, descTemplates: PLACE_DESC_TEMPLATES, emoji: "🏛️",
    enigmaBank: PLACE_ENIGMA, hintBank: PLACE_HINT, missionBank: PLACE_MISSION,
  });
}

// ---------------------------------------------------------------------------
// General-knowledge riddle bank, per MagiQo level. Unlike enigmas (which are
// about a specific object/animal/place), riddles are standalone brain
// teasers — calc, general knowledge, history & geography — used as a
// preliminary challenge before a step. Mix of free-text and multiple-choice.
// ---------------------------------------------------------------------------

const RIDDLE_BANK = {
  explorateur: [
    { category: "Calcul", question: "Combien font 2 + 3 ?", type: "text", answer: "5" },
    { category: "Couleurs", question: "Quelle couleur obtient-on en mélangeant le bleu et le jaune ?", type: "choice", choices: ["Vert", "Orange", "Violet"], answer: "Vert" },
    { category: "Animaux", question: "Quel animal dit 'miaou' ?", type: "choice", choices: ["Le chien", "Le chat", "La vache"], answer: "Le chat" },
    { category: "Formes", question: "Combien de côtés a un carré ?", type: "text", answer: "4" },
  ],
  apprenti: [
    { category: "Calcul", question: "Combien font 7 x 4 ?", type: "text", answer: "28" },
    { category: "Culture générale", question: "Quelle est la capitale de la France ?", type: "text", answer: "Paris" },
    { category: "Histoire & Géo", question: "Sur quel continent se trouve l'Égypte ?", type: "choice", choices: ["Asie", "Afrique", "Europe"], answer: "Afrique" },
    { category: "Nature", question: "Combien de pattes a une araignée ?", type: "choice", choices: ["6", "8", "10"], answer: "8" },
  ],
  aventurier: [
    { category: "Calcul", question: "Quel est le résultat de 12 x 12 ?", type: "text", answer: "144" },
    { category: "Histoire & Géo", question: "Quel fleuve traverse Paris ?", type: "text", answer: "La Seine" },
    { category: "Culture générale", question: "Combien de continents compte notre planète ?", type: "choice", choices: ["5", "6", "7"], answer: "7" },
    { category: "Sciences", question: "Quelle planète est surnommée la planète rouge ?", type: "text", answer: "Mars" },
  ],
  expert: [
    { category: "Histoire & Géo", question: "En quelle année a eu lieu la Révolution française ?", type: "text", answer: "1789" },
    { category: "Culture générale", question: "Quel est le plus long fleuve du monde ?", type: "choice", choices: ["Le Nil", "L'Amazone", "Le Mississippi"], answer: "Le Nil" },
    { category: "Sciences", question: "Quel est le symbole chimique de l'or ?", type: "text", answer: "Au" },
    { category: "Histoire & Géo", question: "Quelle civilisation a construit Machu Picchu ?", type: "text", answer: "Les Incas" },
  ],
};

// Returns `count` fresh riddle objects for the given level, ready to append
// to an entity's riddles[level] array.
export function generateRiddles(level, count = 2) {
  const bank = RIDDLE_BANK[level] || RIDDLE_BANK.apprenti;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((r) => ({ id: uid(), ...r }));
}
