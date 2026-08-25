-- ---------------------------------------------------------------------------
-- MagiQo — schéma Supabase.
--
-- Une seule table "polymorphe" (app_rows) sert de support à TOUTES les
-- collections de l'app (parcours, game_objects, animals, places, riddles,
-- users, ...), chacune identifiée par la colonne `collection`. Le contenu
-- propre à chaque enregistrement (tous les champs métier : real_name,
-- enigma_explorateur, validation_mode, world, etc.) vit dans la colonne
-- JSONB `data`. C'est délibéré : ce schéma reproduit fidèlement le modèle
-- "objets flexibles" qu'avait le localStorage (voir src/lib/db.js), donc
-- ajouter un nouveau champ à une entité ne nécessite JAMAIS de migration
-- SQL — exactement comme avant.
--
-- À exécuter une fois dans Supabase → SQL Editor.
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto;

create table if not exists app_rows (
  id uuid primary key default gen_random_uuid(),
  collection text not null,
  -- NULL pour les enregistrements globaux (ex : "users", cherchés par email
  -- avant même qu'un code de licence ne soit connu). Pour toutes les autres
  -- collections, tagué avec le code de licence du Maître du Jeu propriétaire
  -- — sert de frontière applicative entre organisations (voir la note de
  -- sécurité plus bas), PAS d'authentification cryptographique.
  license_code text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text default 'local',
  data jsonb not null default '{}'::jsonb
);

create index if not exists app_rows_collection_idx on app_rows (collection);
create index if not exists app_rows_collection_license_idx on app_rows (collection, license_code);
create index if not exists app_rows_data_gin_idx on app_rows using gin (data);

-- Maintient updated_date automatiquement à chaque UPDATE, même si le
-- client oublie de le renseigner.
create or replace function app_rows_touch_updated_date()
returns trigger as $$
begin
  new.updated_date = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_app_rows_touch on app_rows;
create trigger trg_app_rows_touch
  before update on app_rows
  for each row execute function app_rows_touch_updated_date();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- ⚠️ Modèle de sécurité assumé, identique à celui déjà documenté pour le
-- serveur de synchronisation MagiQo (server-sync/README.md) : le code de
-- licence sert de frontière APPLICATIVE (l'app ne montre/modifie que les
-- lignes de la licence active), mais N'EST PAS vérifié cryptographiquement
-- ici — ces politiques RLS sont permissives (n'importe qui possédant la clé
-- "anon" publique peut lire/écrire n'importe quelle ligne via l'API REST
-- directe, en dehors de l'app). C'est un compromis délibéré pour rester
-- simple sans migrer vers Supabase Auth. Voir supabase/README.md pour
-- durcir ce modèle si nécessaire (Supabase Auth + policies sur auth.uid()).
alter table app_rows enable row level security;

drop policy if exists "public read" on app_rows;
create policy "public read" on app_rows for select using (true);

drop policy if exists "public insert" on app_rows;
create policy "public insert" on app_rows for insert with check (true);

drop policy if exists "public update" on app_rows;
create policy "public update" on app_rows for update using (true);

drop policy if exists "public delete" on app_rows;
create policy "public delete" on app_rows for delete using (true);

-- ---------------------------------------------------------------------------
-- Realtime : nécessaire pour que src/lib/db.js reçoive les changements
-- venant d'un AUTRE appareil/onglet en direct (voir startRealtime()).
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table app_rows;
