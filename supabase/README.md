# MagiQo — Configuration Supabase

MagiQo utilise Supabase comme base de données partagée : toutes les données
de jeu (parcours, objets, animaux, lieux, devinettes, comptes, tickets...)
y vivent, avec synchronisation en temps réel entre tous les appareils.

## 1. Créer le projet

1. [supabase.com](https://supabase.com) → **New project** (le plan gratuit
   suffit largement pour démarrer)
2. Notez le **mot de passe de base de données** que vous choisissez à cette
   étape — vous ne le reverrez plus ensuite
3. Attendez ~2 minutes que le projet soit prêt

## 2. Créer le schéma

1. Dans votre projet → **SQL Editor** → **New query**
2. Collez tout le contenu de [`schema.sql`](./schema.sql) → **Run**
3. Vérifiez dans **Table Editor** qu'une table `app_rows` est apparue

## 3. Récupérer les clés

Dans votre projet → **Project Settings → API** :
- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY`

⚠️ Ne prenez jamais la clé **service_role** pour ces variables — celle-ci
donne un accès total sans passer par la sécurité (RLS) et ne doit jamais
apparaître dans du code exécuté dans un navigateur.

## 4. Configurer l'app

**En local**, créez `.env.local` à la racine (copiez `.env.example`) :
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Sur Netlify**, Site settings → Environment variables → ajoutez les deux
mêmes clés, puis redéployez (Deploys → Trigger deploy).

Sans ces deux variables, l'app se charge mais toute lecture/écriture de
données échoue avec un message explicite en console (voir
`src/lib/supabaseClient.js`).

## 5. Vérifier que Realtime est actif

Le fichier `schema.sql` active déjà Realtime sur `app_rows`
(`alter publication supabase_realtime add table app_rows;`). Vous pouvez
vérifier dans Supabase → **Database → Replication** que `app_rows` apparaît
bien dans la liste des tables répliquées.

## Comment ça marche

- **Une seule table** `app_rows` sert de support à toutes les "collections"
  de l'app (parcours, objets, animaux...), chacune identifiée par sa
  colonne `collection`. Le contenu métier vit dans une colonne JSONB
  `data` — voir les commentaires en tête de `schema.sql` et `src/lib/db.js`
  pour le détail.
- **Cloisonnement par organisation** : chaque Maître du Jeu a un code de
  licence, stocké sur chaque ligne qu'il crée (`license_code`). Les écrans
  d'administration ne montrent que les données de la licence active sur
  l'appareil connecté.
- **Un joueur peut rejoindre n'importe quel parcours depuis n'importe quel
  appareil** : la recherche par code d'accès (`ParcoursCodeEntry.jsx`) est
  volontairement globale, sans cloisonnement — sinon un joueur sans
  compte/licence ne pourrait jamais rejoindre un parcours créé par
  quelqu'un d'autre.
- **Temps réel** : `src/lib/db.js` → `startRealtime()` (appelé une fois au
  démarrage dans `App.jsx`) écoute les changements Postgres et rafraîchit
  automatiquement les écrans ouverts sur d'autres appareils, sans recharger
  la page.

## ⚠️ Modèle de sécurité — à lire avant mise en production

Les politiques RLS de `schema.sql` sont **permissives** : n'importe qui
possédant la clé publique "anon" (visible dans le code source d'un site
qui l'utilise) peut lire/écrire n'importe quelle ligne de `app_rows` en
appelant directement l'API REST de Supabase, en dehors de l'app MagiQo.
Le `license_code` sert de frontière **applicative** (l'app elle-même ne
montre/modifie que les données de la licence active) mais **n'est pas une
protection cryptographique**.

C'est un compromis délibéré pour rester simple, cohérent avec le reste du
projet (voir `server-sync/README.md` et `server-example/README.md`, qui
documentent le même choix pour d'autres fonctionnalités). Pour la plupart
des usages (un outil interne, quelques organisations de confiance), c'est
suffisant. Pour durcir ce modèle :

1. **Migrer vers Supabase Auth** (email/mot de passe géré par Supabase
   plutôt que par `src/lib/auth.js`) — permettrait des policies RLS basées
   sur `auth.uid()` / `auth.jwt()`, vérifiées côté serveur et impossibles à
   contourner.
2. **Ou** router les écritures sensibles via une Edge Function Supabase
   (ou un petit serveur, comme `server-example/`) qui valide le code de
   licence côté serveur avant d'utiliser la clé `service_role`.

Ni l'un ni l'autre n'est fait dans cette version — c'est noté ici en toute
transparence plutôt que présenté comme réglé.

## Limite connue : les photos

Les photos (objets, lieux, animaux) restent stockées en base64 directement
dans la colonne JSONB `data`, comme au temps du localStorage. Ça fonctionne,
mais ce n'est pas optimal pour de gros volumes (chaque ligne peut peser
plusieurs centaines de Ko). Une amélioration naturelle serait de migrer
vers **Supabase Storage** (upload du fichier, stockage de son URL publique
à la place du base64) — non fait dans cette version.

## Je n'ai pas pu tester ceci en conditions réelles

Cette intégration a été écrite avec le plus grand soin et le code compile
(`npm run build`), mais elle n'a **pas** été vérifiée contre un vrai projet
Supabase (l'environnement de développement n'y a pas accès). Après avoir
suivi les étapes ci-dessus, voici une checklist pour vérifier vous-même que
tout fonctionne :

- [ ] `npm run build` puis `npm run preview` : l'app se charge sans erreur
      dans la console (pas de message "Supabase n'est pas configuré")
- [ ] Créer un compte (code de licence d'essai `191172sfax`) → un objet
      créé dans Admin → Objets apparaît bien dans Supabase → Table Editor
      → `app_rows` (avec `collection = 'game_objects'`)
- [ ] Ouvrir l'app dans un **second navigateur** (ou navigation privée),
      créer un compte avec le **même** code de licence → l'objet créé sur
      le premier appareil apparaît (sans recharger la page, grâce à
      Realtime)
- [ ] Créer un parcours, générer son code d'accès, puis le rejoindre depuis
      un **troisième** contexte n'ayant jamais créé de compte (page
      d'accueil → Rejoindre un parcours) → le parcours doit être trouvable
      et jouable normalement
- [ ] Deux comptes avec des codes de licence **différents** ne voient pas
      les objets/parcours l'un de l'autre dans leur Admin

Si une de ces étapes échoue, le plus probable est une politique RLS
manquante (revérifiez que `schema.sql` a bien été exécuté en entier) ou une
variable d'environnement mal recopiée.
