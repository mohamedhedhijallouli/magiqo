import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Identifiant de build unique à chaque exécution de `vite build`. Écrit à la
// fois dans le bundle JS (via `define`, ci-dessous) et dans un fichier statique
// `version.json` servi tel quel (voir src/components/shared/VersionWatcher.jsx) :
// comparer les deux au runtime permet de détecter qu'une nouvelle version a
// été déployée pendant qu'un onglet resté ouvert (ou son cache navigateur)
// tourne encore sur l'ancienne — indépendamment de la configuration de cache
// de l'hébergeur, qui échappe totalement au contrôle de l'application.
const BUILD_ID = String(Date.now())
fs.mkdirSync('public', { recursive: true })
fs.writeFileSync('public/version.json', JSON.stringify({ buildId: BUILD_ID }))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  define: {
    __MAGIQO_BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  server: {
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
})
