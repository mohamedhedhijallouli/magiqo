# MagiQo — Serveur de synchronisation multi-appareils (obsolète)

> ⚠️ **Ce serveur n'est plus utilisé par défaut.** Depuis la migration de
> MagiQo vers Supabase comme base de données partagée (voir `supabase/`),
> la synchronisation multi-appareils se fait nativement et en temps réel
> via Supabase Realtime — plus besoin de ce serveur de polling maison.
> Ce dossier est conservé pour référence / comme solution de repli si vous
> préférez ne pas utiliser Supabase.

Résout le problème *"je n'ai pas les mêmes données sur un autre appareil"* :
MagiQo stocke normalement tout dans le `localStorage` du navigateur (voir
`src/lib/db.js`), qui n'est jamais partagé entre appareils. Ce serveur ajoute
une synchronisation réelle, par code de licence.

## Démarrage rapide

```bash
cd server-sync
npm init -y
npm install express cors
node server.js
```

Le serveur écoute sur `http://localhost:3002`.

## Brancher MagiQo dessus

1. Déployez ce serveur (Render, Railway, Fly.io, un VPS...) — il a besoin
   d'un disque persistant pour le dossier `data/` (pas une plateforme
   100% serverless à froid, sauf si vous adaptez le stockage vers une
   vraie base de données)
2. Dans MagiQo → **Admin → Réglages → Synchronisation**, collez l'URL
   publique (ex: `https://votre-app.onrender.com`)
3. C'est tout : dès qu'un Maître du Jeu est connecté avec un code de
   licence, ses données se synchronisent automatiquement entre tous les
   appareils utilisant ce même code

## Comment ça marche

- **Écriture locale** → poussée vers le serveur ~2 secondes après (le temps
  que la saisie se stabilise), sous la clé du code de licence actif
- **Au chargement de l'app, au retour au premier plan, et toutes les 20s** →
  l'app vérifie si le serveur a une version plus récente et l'applique si
  besoin
- Chaque code de licence a son propre instantané de données, isolé des
  autres (fichier `data/<LICENCE>.json`)

## ⚠️ Limite assumée : pas de fusion, "dernier écrit gagne"

Ce n'est **pas** une base de données collaborative temps réel. Si deux
appareils modifient des données en même temps sans s'être resynchronisés
entre-temps, la dernière écriture reçue efface l'autre intégralement (pas de
fusion champ par champ). Pour l'usage visé — un Maître du Jeu qui bascule
entre son ordinateur et son téléphone, ou une petite équipe qui n'édite pas
simultanément — c'est un compromis raisonnable. Si vous avez besoin d'édition
collaborative simultanée robuste, il faudrait une vraie base de données avec
résolution de conflits (hors du périmètre de cet exemple).

## Sécurité

- Le code de licence sert de clé d'accès aux données (comme un mot de passe)
  — gardez ce serveur en HTTPS
- Optionnel : définissez `SYNC_API_KEY` côté serveur pour exiger un jeton
  partagé supplémentaire (utile si ce serveur est mutualisé entre plusieurs
  organisations) ; renseignez alors la même valeur dans MagiQo → Admin →
  Réglages → Synchronisation → Clé (optionnelle)
- Le stockage actuel est un simple fichier JSON par licence
  (`data/<LICENCE>.json`) — largement suffisant pour ce volume de données,
  mais migrez vers une vraie base (Postgres, SQLite...) si vous gérez
  beaucoup de licences actives

## Format de l'API

**GET** `/api/sync/:license`
```json
{ "updatedAt": 1734000000000, "collections": { "parcours": [...], "game_objects": [...] }, "settings": {} }
```

**PUT** `/api/sync/:license`
```json
{ "collections": { "parcours": [...], "game_objects": [...] }, "settings": {} }
```
→ renvoie `{ "updatedAt": ... }`
