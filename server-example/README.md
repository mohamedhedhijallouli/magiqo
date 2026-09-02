# MagiQo — Endpoint de reconnaissance IA (exemple)

MagiQo peut valider une étape par **photo**, de deux façons :

| Mode | Où ça tourne | Clé API nécessaire | Fiabilité |
|---|---|---|---|
| **Photo — comparaison locale** | 100% dans le navigateur du joueur (`src/lib/perceptualHash.js`) | Non | Bonne si la photo de référence est prise dans des conditions proches (même angle/lumière) |
| **Photo — reconnaissance IA** | Ce serveur, que vous déployez | Oui, gardée ici | Meilleure : comprend réellement le contenu de l'image |

Le mode local ne nécessite **aucune configuration** : il fonctionne dès qu'une photo de référence est ajoutée à l'objet dans l'admin. Ce dossier ne concerne que le second mode.

## Pourquoi un serveur séparé ?

MagiQo est une application 100% client (voir `src/lib/db.js` — tout vit dans le `localStorage` du navigateur, pas de backend). Une clé API Anthropic/OpenAI ne doit **jamais** être placée dans le code d'une app client : n'importe qui peut l'extraire via les DevTools du navigateur et l'utiliser à vos frais. Ce petit serveur est le seul endroit où la clé doit vivre.

## Démarrage rapide

```bash
cd server-example
npm init -y
npm install express cors @anthropic-ai/sdk
export ANTHROPIC_API_KEY=sk-ant-...
node server.js
```

Le serveur écoute sur `http://localhost:3001/api/recognize`.

## Brancher MagiQo dessus

1. Déployez ce serveur quelque part (Render, Railway, Fly.io, une fonction Vercel/Netlify, ou votre propre VPS)
2. Dans MagiQo → **Admin → Réglages → Reconnaissance IA**, collez l'URL publique (ex: `https://votre-app.onrender.com/api/recognize`)
3. Dans l'éditeur d'un objet, choisissez **Mode de validation → Photo — reconnaissance IA**

## Contrat de l'API

**Requête** (envoyée automatiquement par `src/lib/aiVision.js`) :
```json
{ "image": "data:image/jpeg;base64,...", "expectedLabel": "une fibule wisigothique en bronze" }
```

**Réponse attendue** :
```json
{ "match": true, "confidence": 92, "reason": "La photo montre bien une fibule en bronze de style wisigothique." }
```

## Sécurité en production

- Restreignez `cors()` à l'origine réelle de votre app MagiQo plutôt que d'accepter toutes les origines
- Ajoutez une limitation de débit (ex: `express-rate-limit`) pour éviter les abus sur votre quota IA
- Envisagez un token partagé simple (header `Authorization`) entre l'app et ce serveur si l'URL devient publique

## Repli automatique

Si cet endpoint n'est pas configuré, injoignable, ou renvoie une erreur, `PhotoChallenge.jsx` bascule automatiquement sur la comparaison locale (si une empreinte de référence existe) plutôt que de bloquer le joueur — voir le commentaire dans `src/components/game/PhotoChallenge.jsx`.
