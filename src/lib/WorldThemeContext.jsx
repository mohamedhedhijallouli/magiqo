import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { WORLDS, getWorld, worldToCssVars } from "@/lib/worlds";

const WorldThemeContext = createContext(null);

// Applique un World en réécrivant les variables CSS sur <html>. Utilisé
// aussi bien par Play.jsx (le joueur est dans le World du parcours qu'il
// joue) que par PrintView.jsx (l'impression doit matcher le World choisi
// par le Maître du Jeu). En dehors de ces deux endroits, aucun appel n'est
// fait : le thème par défaut (Grimoire) déjà présent dans index.css :root
// s'applique tel quel — Admin, Login, etc. restent inchangés.
export function WorldThemeProvider({ worldSlug, children }) {
  const world = useMemo(() => getWorld(worldSlug), [worldSlug]);

  useEffect(() => {
    const root = document.documentElement;
    const vars = worldToCssVars(world);
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    // Au démontage, on retire les overrides pour retomber sur le thème par
    // défaut défini dans :root plutôt que de laisser le dernier World joué
    // "coller" à l'Admin ou à l'écran d'accueil.
    return () => {
      Object.keys(vars).forEach((k) => root.style.removeProperty(k));
    };
  }, [world]);

  return (
    <WorldThemeContext.Provider value={{ world }}>
      {children}
    </WorldThemeContext.Provider>
  );
}

export function useWorldTheme() {
  const ctx = useContext(WorldThemeContext);
  return ctx?.world || WORLDS[0];
}
