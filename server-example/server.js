/**
 * MagiQo — exemple d'endpoint serveur pour la reconnaissance visuelle par IA.
 * -----------------------------------------------------------------------
 * MagiQo est une application 100% client (aucun backend). Ce petit serveur
 * (une trentaine de lignes utiles) est le SEUL endroit où doit vivre votre
 * clé API — jamais dans le code de l'app, jamais dans le navigateur.
 *
 * Ce que fait ce endpoint :
 *   1. Reçoit { image, expectedLabel } depuis PhotoChallenge.jsx
 *   2. Appelle l'API Claude (modèle avec vision) en lui demandant de juger
 *      si la photo correspond à la description attendue
 *   3. Renvoie { match, confidence, reason } — le contrat attendu par
 *      src/lib/aiVision.js côté app
 *
 * Déploiement : n'importe quel hébergeur Node (Render, Railway, Fly.io,
 * une fonction serverless Vercel/Netlify, ou votre propre VPS). Une fois
 * déployé, collez son URL dans MagiQo → Admin → Réglages → Reconnaissance
 * IA. Rien d'autre à faire côté app.
 *
 * Installation :
 *   npm init -y
 *   npm install express cors @anthropic-ai/sdk
 *   ANTHROPIC_API_KEY=sk-ant-... node server.js
 */

const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
app.use(cors()); // en production, restreignez à l'origine de votre app MagiQo
app.use(express.json({ limit: "10mb" })); // les photos en base64 peuvent être lourdes

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post("/api/recognize", async (req, res) => {
  try {
    const { image, expectedLabel } = req.body;
    if (!image || !expectedLabel) {
      return res.status(400).json({ error: "image et expectedLabel sont requis" });
    }

    // `image` est une data URL ("data:image/jpeg;base64,...") envoyée telle
    // quelle par fileToDataUrl() côté client — on en extrait le média-type
    // et les données brutes pour l'API Anthropic.
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: "format d'image invalide" });
    const [, mediaType, base64Data] = match;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
            {
              type: "text",
              text:
                `Cette photo montre-t-elle : "${expectedLabel}" ? ` +
                `Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour, au format : ` +
                `{"match": true|false, "confidence": 0-100, "reason": "courte explication en une phrase"}`,
            },
          ],
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text")?.text || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json({
      match: !!parsed.match,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
      reason: parsed.reason || "",
    });
  } catch (err) {
    console.error("Erreur reconnaissance IA :", err);
    res.status(500).json({ error: "Échec de la reconnaissance" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Serveur de reconnaissance IA MagiQo sur le port ${PORT}`));
