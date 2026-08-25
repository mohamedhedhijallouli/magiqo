# MagiQo

Créateur de parcours gamifiés : les joueurs explorent un lieu, résolvent
des énigmes et scannent des codes pour progresser dans une quête créée par
un Maître du Jeu, avec 42 univers visuels ("Worlds") au choix — dossier
d'enquête, carte au trésor, arène romaine, centre de commandement spatial...

## Stack

- **Frontend** : React + Vite, hébergeable comme site statique (Netlify)
- **Base de données** : Supabase (Postgres), partagée en temps réel entre
  tous les appareils — voir [`supabase/README.md`](./supabase/README.md)
- **Code source** : GitHub

## Démarrage rapide (développement local)

```bash
npm install
cp .env.example .env.local   # puis renseignez vos clés Supabase, voir plus bas
npm run dev                  # http://localhost:5173
```

L'app a besoin d'un projet Supabase configuré pour fonctionner (lecture/
écriture de données) — sans ça, elle se charge mais affiche une erreur
explicite dès qu'un écran essaie de lire des données. Suivez
[`supabase/README.md`](./supabase/README.md) avant de continuer.

## Déployer les trois briques

### 1. GitHub — héberger le code

```bash
cd magiqo
git init
git add .
git commit -m "MagiQo — version Supabase"
gh repo create magiqo --private --source=. --push
# ou, sans l'outil gh :
#   créez un repo vide sur github.com, puis :
#   git remote add origin https://github.com/<votre-compte>/magiqo.git
#   git branch -M main
#   git push -u origin main
```

`.env.local` n'est **jamais** poussé sur GitHub (déjà exclu par
`.gitignore`, règle `*.local`) — vos clés Supabase ne partent donc pas avec
le code. C'est normal et voulu : Netlify les récupère séparément (étape 3).

### 2. Supabase — la base de données

Suivez [`supabase/README.md`](./supabase/README.md) en entier (créer le
projet, exécuter `supabase/schema.sql`, récupérer les deux clés). Cette
étape doit être faite **avant** l'étape Netlify, puisque Netlify a besoin
de ces clés pour construire l'app.

### 3. Netlify — héberger le site

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project** → connectez votre compte GitHub → sélectionnez le
   repo `magiqo`
2. Netlify détecte automatiquement `netlify.toml` (déjà présent à la
   racine : commande de build, dossier de publication, redirections SPA,
   en-têtes de cache — rien à configurer manuellement)
3. **Avant de cliquer sur Deploy** : Site settings → Environment variables
   → ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (les valeurs
   récupérées à l'étape 2)
4. Deploy site

Chaque `git push` sur la branche principale redéploiera automatiquement.
Le mécanisme de détection de nouvelle version (bandeau "Actualiser" — voir
`src/components/shared/VersionWatcher.jsx`) prévient les utilisateurs ayant
un onglet resté ouvert qu'un nouveau déploiement est disponible.

## Comptes de démonstration

Code de licence d'essai : `191172sfax` (valable 7 jours à partir de la
première utilisation) — à saisir sur l'écran d'inscription pour créer un
compte Maître du Jeu et commencer à créer des parcours.

## Structure du projet

```
src/
  lib/          db.js (données Supabase), auth.js, license.js, i18n.js,
                worlds.js (catalogue des 42 Worlds), perceptualHash.js,
                aiVision.js
  components/
    ui/         primitives (Button, Card, Modal, Field, Tabs, Toast...)
    game/       écrans de jeu (code d'accès, énigmes, timer, victoire...)
    game/archetypes/  variantes visuelles par archétype de World
                (dossier, carte, arène, carnet, dashboard)
    parent/     gestion des objets et parcours + impression
    admin/      parents, animaux, catégories, paramètres, licences
    shared/     historique, sélecteur de langue, watcher de version
  pages/        Home, Play, ParentSpace, AdminDashboard, Login, Register

supabase/       schema.sql + README.md — base de données partagée
server-example/ serveur optionnel pour la reconnaissance photo par IA
server-sync/    ancien serveur de synchronisation (obsolète, voir son README)
```

## Fonctionnalités principales

- **42 Worlds** — un même moteur de jeu, 42 habillages visuels complets
  (couleurs, polices, mise en page) sélectionnables par parcours
- **Validation d'étape flexible** — code manuel, QR code, GPS, ou photo
  (comparaison locale sans IA, ou reconnaissance par IA via un serveur
  optionnel — voir `server-example/README.md`)
- **4 niveaux de difficulté** choisis par le joueur (Explorateur, Apprenti
  Aventurier, Aventurier, Expert), avec énigme/indice/mission dédiés à
  chacun pour chaque objet/animal/lieu
- **Lieux et sites UNESCO** — import de la base des 1273 biens du
  patrimoine mondial en 6 langues, décomposition automatique d'un site en
  sous-lieux
- **6 langues** : français, anglais, espagnol, arabe (RTL), chinois, russe
- **Multi-organisation** — chaque code de licence cloisonne ses propres
  données (parcours, objets, tuteurs...), tout en laissant n'importe quel
  joueur rejoindre n'importe quel parcours par son code d'accès, quel que
  soit son appareil

## Licences (le système de licence, pas Supabase)

L'accès Maître du Jeu demande un code de licence (générateur disponible
dans Admin → Licences). Ceci est indépendant de Supabase : c'est le système
métier de MagiQo pour gérer les abonnements/essais.
