import { createClient } from "@supabase/supabase-js";

// Variables d'environnement injectées au build par Vite (voir .env.example
// à la racine). Sur Netlify : Site settings → Environment variables.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = !!url && !!anonKey;

if (!supabaseEnabled && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    "[MagiQo] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants — " +
      "voir supabase/README.md pour la configuration. L'app ne pourra pas lire/écrire de données."
  );
}

export const supabase = supabaseEnabled ? createClient(url, anonKey) : null;
