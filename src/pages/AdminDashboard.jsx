import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldHalf, History, Users, Map, Package, PawPrint, Tags, Settings, Landmark, Compass, Ticket, HelpCircle } from "lucide-react";
import StarsBackground from "@/components/game/StarsBackground";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import StatCard from "@/components/shared/StatCard";
import { Tabs } from "@/components/ui/Misc";
import { Parents, Parcours, GameObjects, Places, Quests, subscribe, getAdminActiveLicenseCode } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import ParcoursManager from "@/components/parent/ParcoursManager";
import ObjectsManager from "@/components/parent/ObjectsManager";
import HistoryTable from "@/components/shared/HistoryTable";
import ParentsManager from "@/components/admin/ParentsManager";
import AnimalsManager from "@/components/admin/AnimalsManager";
import AnimalTypesManager from "@/components/admin/AnimalTypesManager";
import CategoriesManager from "@/components/admin/CategoriesManager";
import PlacesManager from "@/components/admin/PlacesManager";
import PlaceTypesManager from "@/components/admin/PlaceTypesManager";
import ParcoursTypesManager from "@/components/admin/ParcoursTypesManager";
import RiddlesManager from "@/components/admin/RiddlesManager";
import RiddleTypesManager from "@/components/admin/RiddleTypesManager";
import TicketsPanel from "@/components/admin/TicketsPanel";
import SettingsPanel from "@/components/admin/SettingsPanel";

// V23 : l'écran "Code de licence / Mot de passe" a été supprimé — l'espace
// Maître du Jeu est désormais accessible directement en cliquant sur la
// carte "Maître du Jeu" depuis l'accueil, sans étape de connexion.
// L'infrastructure de licence (lib/license.js) continue de fonctionner en
// arrière-plan pour les quotas (joueurs/tuteurs/langues) via getActiveLicense(),
// qui retombe sur des valeurs par défaut si aucune licence n'est enregistrée.

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("history");
  const [stats, setStats] = useState({ quests: 0, parents: 0, parcours: 0, objects: 0, places: 0 });

  async function loadStats() {
    const license_code = getAdminActiveLicenseCode();
    const [quests, parents, parcours, objects, places] = await Promise.all([
      Quests.filter({ license_code }), Parents.filter({ is_active: true, license_code }), Parcours.filter({ is_active: true, license_code }), GameObjects.filter({ license_code }), Places.filter({ license_code }),
    ]);
    setStats({ quests: quests.length, parents: parents.length, parcours: parcours.length, objects: objects.length, places: places.length });
  }
  useEffect(() => {
    loadStats();
    return subscribe(() => loadStats());
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-radial-fade">
      <StarsBackground density={50} />
      <div className="relative z-10 flex items-center justify-between p-5">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-void-panel/70 border border-void-border text-parchment hover:border-gold-dim hover:text-gold-bright transition-colors text-sm font-semibold"
        >
          <ArrowLeft size={18} /> {t("common_back_home")}
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 px-4 pb-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <ShieldHalf className="text-gold" size={26} />
            <h1 className="font-display text-2xl text-gold-bright">{t("admin_login_title")}</h1>
          </div>

          <div className="grid sm:grid-cols-5 gap-4 mb-8">
            <StatCard icon={<Map size={20} />} label={t("admin_stats_quests")} value={stats.quests} accent="arcane" />
            <StatCard icon={<Users size={20} />} label={t("admin_stats_parents")} value={stats.parents} accent="gold" />
            <StatCard icon={<Map size={20} />} label={t("admin_stats_parcours")} value={stats.parcours} accent="emerald" />
            <StatCard icon={<Package size={20} />} label={t("admin_stats_objects")} value={stats.objects} accent="ember" />
            <StatCard icon={<Landmark size={20} />} label={t("admin_stats_places")} value={stats.places} accent="arcane" />
          </div>

          <Tabs
            className="mb-6"
            tabs={[
              { value: "history", label: t("admin_tab_history"), icon: <History size={15} /> },
              { value: "parents", label: t("admin_tab_parents"), icon: <Users size={15} /> },
              { value: "parcours", label: t("admin_tab_parcours"), icon: <Map size={15} /> },
              { value: "parcours_types", label: t("admin_tab_parcours_types"), icon: <Compass size={15} /> },
              { value: "objects", label: t("admin_tab_objects"), icon: <Package size={15} /> },
              { value: "categories", label: t("admin_tab_categories"), icon: <Tags size={15} /> },
              { value: "animals", label: t("admin_tab_animals"), icon: <PawPrint size={15} /> },
              { value: "animal_types", label: t("admin_tab_animal_types"), icon: <PawPrint size={15} /> },
              { value: "places", label: t("admin_tab_places"), icon: <Landmark size={15} /> },
              { value: "place_types", label: t("admin_tab_place_types"), icon: <Compass size={15} /> },
              { value: "riddles", label: t("admin_tab_riddles"), icon: <HelpCircle size={15} /> },
              { value: "riddle_types", label: t("admin_tab_riddle_types"), icon: <HelpCircle size={15} /> },
              { value: "tickets", label: t("tix_title"), icon: <Ticket size={15} /> },
              { value: "settings", label: t("admin_tab_settings"), icon: <Settings size={15} /> },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === "history" && <HistoryTable />}
          {tab === "parents" && <ParentsManager />}
          {tab === "parcours" && <ParcoursManager adminMode parentInfo={{ created_by_admin: true }} />}
          {tab === "parcours_types" && <ParcoursTypesManager />}
          {tab === "objects" && <ObjectsManager />}
          {tab === "categories" && <CategoriesManager />}
          {tab === "animals" && <AnimalsManager />}
          {tab === "animal_types" && <AnimalTypesManager />}
          {tab === "places" && <PlacesManager />}
          {tab === "place_types" && <PlaceTypesManager />}
          {tab === "riddles" && <RiddlesManager />}
          {tab === "riddle_types" && <RiddleTypesManager />}
          {tab === "tickets" && <TicketsPanel />}
          {tab === "settings" && <SettingsPanel />}
        </motion.div>
      </div>
    </div>
  );
}
