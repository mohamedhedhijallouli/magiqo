import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, ShieldHalf, Sparkles, Sword } from "lucide-react";
import StarsBackground from "@/components/game/StarsBackground";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import PresentationModal from "@/components/shared/PresentationModal";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";
import { getSession, logout } from "@/lib/auth";

export default function UserDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPresentation, setShowPresentation] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) navigate("/login");
  }, [navigate]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const cards = [
    { to: "/admin", titleKey: "dash_card_admin", subKey: "dash_card_admin_sub", emoji: "👑", accent: "from-gold/25 to-gold/5 border-gold-dim/50 text-gold-bright" },
    { to: "/parent", titleKey: "dash_card_tutor", subKey: "dash_card_tutor_sub", emoji: "👨‍🏫", accent: "from-arcane/25 to-arcane/5 border-arcane/40 text-arcane" },
    { to: "/play", titleKey: "dash_card_player", subKey: "dash_card_player_sub", emoji: "🎮", accent: "from-ember/25 to-ember/5 border-ember/40 text-ember-bright" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-radial-fade">
      <StarsBackground density={50} />
      <div className="relative z-10 flex items-center justify-between p-5">
        <span />
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={15} /> {t("common_logout")}
          </Button>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="relative z-10 px-4 pb-16 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-display text-xl text-gold-bright mb-3">{t("dash_title")}</h1>
          <p className="text-parchment/80 text-sm max-w-2xl mx-auto leading-relaxed">{t("home_explainer")}</p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5 mb-8">
          {cards.map((c, i) => (
            <motion.div key={c.to} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link
                to={c.to}
                className={`group flex flex-col items-center text-center gap-3 rounded-2xl border bg-gradient-to-b p-7 h-full transition-all duration-300 card-seal ${c.accent}`}
              >
                <div className="w-16 h-16 rounded-2xl bg-void/50 flex items-center justify-center border border-white/10 text-3xl group-hover:scale-110 transition-transform">
                  {c.emoji}
                </div>
                <span className="font-display text-lg text-parchment">{t(c.titleKey)}</span>
                <span className="text-sm text-muted">{t(c.subKey)}</span>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button variant="arcane" onClick={() => setShowPresentation(true)}>
            {t("dash_presentation_btn")}
          </Button>
        </div>
      </div>

      <PresentationModal open={showPresentation} onClose={() => setShowPresentation(false)} />
    </div>
  );
}
