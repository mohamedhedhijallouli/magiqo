// ---------------------------------------------------------------------------
// Reconnaissance visuelle SANS IA — empreinte perceptuelle (dHash).
//
// Principe : on réduit l'image à une grille minuscule (9×8 pixels) en
// niveaux de gris, puis on compare chaque pixel à son voisin de droite
// (plus clair / plus sombre → 1/0). On obtient une empreinte de 64 bits qui
// résiste raisonnablement aux changements de luminosité, de compression et
// de léger recadrage — sans réseau de neurones, sans appel réseau, sans
// dépendance externe. C'est le même principe utilisé par TinEye ou la
// détection de doublons d'images.
//
// Deux photos du même objet auront une distance de Hamming faible (peu de
// bits différents) ; deux photos d'objets différents auront une distance
// élevée. Ce n'est PAS de la reconnaissance d'objet à proprement parler
// (aucune compréhension du contenu) : ça compare une photo à UNE photo de
// référence précise. Voir lib/aiVision.js pour la vraie reconnaissance.
// ---------------------------------------------------------------------------

const HASH_W = 9; // 9x8 -> 8x8 comparaisons -> 64 bits
const HASH_H = 8;

// Calcule l'empreinte dHash d'une image (data URL, Blob ou HTMLImageElement)
// et retourne une chaîne hexadécimale de 16 caractères (64 bits).
export async function computePerceptualHash(source) {
  const img = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = HASH_W;
  canvas.height = HASH_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, HASH_W, HASH_H);
  const { data } = ctx.getImageData(0, 0, HASH_W, HASH_H);

  // Niveaux de gris (luminance perceptuelle standard)
  const gray = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  let bits = "";
  for (let y = 0; y < HASH_H; y++) {
    for (let x = 0; x < HASH_W - 1; x++) {
      const left = gray[y * HASH_W + x];
      const right = gray[y * HASH_W + x + 1];
      bits += left > right ? "1" : "0";
    }
  }
  return bitsToHex(bits);
}

// Distance de Hamming entre deux empreintes hex (nombre de bits différents,
// de 0 = identiques à 64 = opposées).
export function hammingDistance(hexA, hexB) {
  if (!hexA || !hexB || hexA.length !== hexB.length) return 64;
  let dist = 0;
  for (let i = 0; i < hexA.length; i++) {
    let x = parseInt(hexA[i], 16) ^ parseInt(hexB[i], 16);
    while (x) { dist += x & 1; x >>= 1; }
  }
  return dist;
}

// Similarité en pourcentage (100% = identiques). Un seuil de 85-90% est un
// bon point de départ pour valider une photo dans MagiQo ; en dessous de
// 75%, il s'agit presque certainement d'une photo différente.
export function similarityPercent(hexA, hexB) {
  const dist = hammingDistance(hexA, hexB);
  return Math.round((1 - dist / 64) * 100);
}

export async function matchesReference(candidateSource, referenceHash, threshold = 85) {
  const candidateHash = await computePerceptualHash(candidateSource);
  const similarity = similarityPercent(candidateHash, referenceHash);
  return { match: similarity >= threshold, similarity, candidateHash };
}

function bitsToHex(bits) {
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4).padEnd(4, "0"), 2).toString(16);
  }
  return hex;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    if (source instanceof HTMLImageElement) { resolve(source); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (typeof source === "string") {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result; };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}
