import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, ShieldCheck, Users, Sword, ArrowLeft, Key } from "lucide-react";
import StarsBackground from "@/components/game/StarsBackground";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Button from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Misc";
import { useLanguage } from "@/lib/LanguageContext";
import { getSession, logout } from "@/lib/auth";
import LicensesPanel from "@/components/admin/LicensesPanel";
import PricingPanel from "@/components/admin/PricingPanel";

export default function MastersDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [view, setView] = useState("dashboard"); // dashboard | licenses
  const [mastersTab, setMastersTab] = useState("licenses"); // licenses | pricing

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "master") navigate("/login");
  }, [navigate]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const cards = [
    { key: "masters", titleKey: "masters_card_masters", subKey: "masters_card_masters_sub", icon: Key, action: () => setView("licenses"), accent: "from-gold/25 to-gold/5 border-gold-dim/50 text-gold-bright" },
    { key: "admin", titleKey: "masters_card_admin", subKey: "masters_card_admin_sub", icon: ShieldCheck, to: "/admin", accent: "from-gold/25 to-gold/5 border-gold-dim/50 text-gold-bright" },
    { key: "tutors", titleKey: "masters_card_tutors", subKey: "masters_card_tutors_sub", icon: Users, to: "/parent", accent: "from-arcane/25 to-arcane/5 border-arcane/40 text-arcane" },
    { key: "player", titleKey: "masters_card_player", subKey: "masters_card_player_sub", icon: Sword, to: "/play", accent: "from-ember/25 to-ember/5 border-ember/40 text-ember-bright" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-radial-fade">
      <StarsBackground density={50} />
      <div className="relative z-10 flex items-center justify-between p-5">
        {view === "licenses" ? (
          <button onClick={() => setView("dashboard")} className="flex items-center gap-2 text-muted hover:text-parchment transition-colors">
            <ArrowLeft size={18} /> {t("auth_back")}
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={15} /> {t("common_logout")}
          </Button>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="relative z-10 px-4 pb-16 max-w-5xl mx-auto">
        {view === "dashboard" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col items-center text-center mb-10">
              <h1 className="font-display text-2xl text-gold-bright">{t("masters_title")}</h1>
              <p className="text-muted text-sm mt-1">{t("masters_sub")}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {cards.map((c, i) => {
                const Comp = c.to ? Link : "button";
                const Icon = c.icon;
                return (
                  <motion.div key={c.key} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Comp
                      to={c.to}
                      onClick={c.action}
                      className={`group w-full flex flex-col items-center text-center gap-3 rounded-2xl border bg-gradient-to-b p-7 h-full transition-all duration-300 card-seal ${c.accent}`}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-void/50 flex items-center justify-center border border-white/10 text-3xl group-hover:scale-110 transition-transform">
                        <Icon size={28} />
                      </div>
                      <span className="font-display text-lg text-parchment">{t(c.titleKey)}</span>
                      <span className="text-sm text-muted">{t(c.subKey)}</span>
                    </Comp>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <div>
            <Tabs
              className="mb-6 max-w-2xl mx-auto"
              tabs={[
                { value: "licenses", label: t("lic_tab_licenses"), icon: <Key size={15} /> },
                { value: "pricing", label: t("lic_tab_pricing"), icon: <ShieldCheck size={15} /> },
              ]}
              active={mastersTab}
              onChange={setMastersTab}
            />
            {mastersTab === "licenses" && <LicensesPanel />}
            {mastersTab === "pricing" && <PricingPanel />}
          </div>
        )}
      </div>
    </div>
  );
}