// ---------------------------------------------------------------------------
// Reconnaissance visuelle AVEC IA — client léger.
//
// IMPORTANT : MagiQo est une application 100% client (aucun serveur, tout
// vit dans le navigateur via localStorage — voir db.js). Une vraie
// reconnaissance d'image par IA nécessite un modèle de vision (Claude,
// GPT-4V, Gemini...), et ces API exigent une clé secrète qui NE DOIT
// JAMAIS être exposée dans le code client (elle serait visible par
// n'importe qui via les DevTools). Ce fichier n'appelle donc jamais un
// fournisseur d'IA directement : il appelle un petit endpoint serveur
// (que vous déployez et dont vous contrôlez l'URL depuis l'Admin), qui
// lui, détient la clé et fait l'appel réel à l'IA.
//
// Un exemple complet de cet endpoint (Node/Express, ~30 lignes) est fourni
// à part — voir server-example/README.md à la racine du projet.
// ---------------------------------------------------------------------------

import { getSetting } from "@/lib/db";

export function getVisionEndpoint() {
  return getSetting("ai_vision_endpoint", "");
}

export function isVisionConfigured() {
  return !!getVisionEndpoint();
}

// candidateImage : data URL (ce que produit un <input type="file"> ou une
// capture caméra via fileToDataUrl).
// expectedLabel : description courte de ce que la photo doit montrer
// (ex: "une fibule wisigothique en bronze avec une tête d'aigle stylisée").
// Retourne { match, confidence, reason } — ou lève une erreur explicite si
// l'endpoint n'est pas configuré / injoignable, à charge de l'appelant de
// proposer un repli (voir PhotoChallenge.jsx).
export async function recognizeObjectWithAI(candidateImage, expectedLabel) {
  const endpoint = getVisionEndpoint();
  if (!endpoint) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: candidateImage, expectedLabel }),
  });

  if (!res.ok) {
    throw new Error("AI_REQUEST_FAILED:" + res.status);
  }

  const data = await res.json();
  // Contrat attendu de l'endpoint : { match: boolean, confidence: 0-100, reason?: string }
  return {
    match: !!data.match,
    confidence: typeof data.confidence === "number" ? data.confidence : null,
    reason: data.reason || "",
  };
}
