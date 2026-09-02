/**
 * MagiQo — serveur de synchronisation multi-appareils.
 * -----------------------------------------------------------------------
 * MagiQo est nativement une application 100% client (tout vit dans le
 * localStorage du navigateur — voir src/lib/db.js). Ce serveur ajoute une
 * synchronisation RÉELLE entre appareils : chaque Maître du Jeu synchronise
 * ses données sous son propre code de licence, qui sert d'identifiant de
 * "tenant" (pas besoin de comptes/mots de passe séparés — la licence
 * existe déjà dans l'app).
 *
 * Principe (Last-Write-Wins, volontairement simple) :
 *   - GET  /api/sync/:license  → renvoie le dernier instantané connu
 *   - PUT  /api/sync/:license  → remplace l'instantané par celui envoyé
 *
 * ⚠️ Limite assumée : il n'y a PAS de fusion champ par champ. Si deux
 * appareils modifient les données EN MÊME TEMPS sans se resynchroniser
 * entre-temps, la dernière écriture reçue par le serveur écrase l'autre.
 * Pour l'usage visé (un Maître du Jeu, quelques appareils, édition rarement
 * simultanée), c'est un compromis raisonnable — pas une base de données
 * collaborative temps réel. Le client (src/lib/sync.js) minimise le risque
 * en re-synchronisant avant chaque écriture programmée.
 *
 * Installation :
 *   npm init -y
 *   npm install express cors
 *   node server.js
 *
 * Variables d'environnement optionnelles :
 *   PORT           - port d'écoute (défaut 3002)
 *   SYNC_API_KEY   - si définie, exige un header
 *                    "Authorization: Bearer <SYNC_API_KEY>" sur chaque
 *                    requête (à renseigner aussi côté MagiQo → Admin →
 *                    Réglages → Synchronisation). Recommandé si ce serveur
 *                    est mutualisé entre plusieurs organisations.
 */

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" })); // les instantanés incluent des photos en base64

const DATA_DIR = path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const SYNC_API_KEY = process.env.SYNC_API_KEY || "";

app.use((req, res, next) => {
  if (!SYNC_API_KEY) return next(); // pas de clé configurée -> pas de vérification
  const header = req.headers.authorization || "";
  if (header === `Bearer ${SYNC_API_KEY}`) return next();
  res.status(401).json({ error: "unauthorized" });
});

function fileForLicense(license) {
  const safe = String(license || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!safe) throw new Error("code de licence invalide");
  return path.join(DATA_DIR, `${safe}.json`);
}

// File d'attente d'écriture très simple, par licence : évite que deux PUT
// concurrents sur la même licence ne corrompent le fichier en s'écrivant
// l'un par-dessus l'autre au milieu de l'opération.
const writeQueues = new Map();
function queueWrite(license, task) {
  const previous = writeQueues.get(license) || Promise.resolve();
  const next = previous.then(task, task);
  writeQueues.set(license, next);
  return next;
}

app.get("/api/sync/:license", (req, res) => {
  try {
    const file = fileForLicense(req.params.license);
    if (!fs.existsSync(file)) {
      return res.json({ updatedAt: null, collections: {}, settings: {} });
    }
    res.json(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/sync/:license", async (req, res) => {
  try {
    const { collections, settings } = req.body || {};
    if (!collections || typeof collections !== "object") {
      return res.status(400).json({ error: "'collections' manquant ou invalide" });
    }
    const license = req.params.license;
    const file = fileForLicense(license);
    const updatedAt = Date.now();
    await queueWrite(license, () => {
      fs.writeFileSync(file, JSON.stringify({ updatedAt, collections, settings: settings || {} }));
    });
    res.json({ updatedAt });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Serveur de synchronisation MagiQo sur le port ${PORT}`));
