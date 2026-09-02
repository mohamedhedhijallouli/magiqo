import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

// Détecte qu'une nouvelle version de l'app a été déployée pendant que cet
// onglet tourne encore sur l'ancienne — utile car MagiQo n'a pas de service
// worker, et un onglet resté ouvert (ou un cache navigateur/CDN trop
// agressif sur index.html) peut continuer à afficher un build périmé
// indéfiniment. On compare l'identifiant de build injecté dans CE bundle JS
// (__MAGIQO_BUILD_ID__, voir vite.config.js) à celui d'un petit fichier
// statique version.json, re-téléchargé avec cache:"no-store" pour ne
// jamais lire une copie en cache. Vérifié au chargement, au retour au
// premier plan (mobile), et toutes les 5 minutes.
export default function VersionWatcher() {
  const { t } = useLanguage();
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/version.json", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.buildId && data.buildId !== __MAGIQO_BUILD_ID__) {
          setStale(true);
        }
      } catch {
        // Hors ligne ou version.json absent (ex: en développement) : on
        // ignore silencieusement, ce n'est pas une erreur applicative.
      }
    }

    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!stale) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:left-auto z-[999] flex items-center gap-3 bg-void-panel border border-gold-dim/50 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-sm text-parchment flex-1">{t("version_update_available")}</p>
      <button
        onClick={() => window.location.reload()}
        className="shrink-0 flex items-center gap-1.5 bg-gradient-to-br from-gold-bright to-gold text-void font-bold text-xs px-3 py-2 rounded-lg"
      >
        <RefreshCw size={13} /> {t("version_update_reload")}
      </button>
    </div>
  );
}
