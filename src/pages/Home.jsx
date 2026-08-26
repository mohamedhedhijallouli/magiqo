import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import StarsBackground from "@/components/game/StarsBackground";
import MagiQoWordmark from "@/components/game/MagiQoWordmark";
import { useLanguage } from "@/lib/LanguageContext";

/* Dictionnaire local pour le Modal afin d'éviter tout bug de clé manquante */
const ROLE_MODAL_TEXTS = {
  fr: {
    title: "Choisissez votre profil",
    subtitle: "Accédez à l'espace adapté à votre rôle",
    master: "Maître du Jeu",
    masterDesc: "Connexion administrateur",
    tutor: "Espace Tuteur",
    tutorDesc: "Accès avec code tuteur",
    player: "Joueur",
    playerDesc: "Rejoindre l'aventure",
  },
  en: {
    title: "Choose your profile",
    subtitle: "Access the area tailored to your role",
    master: "Game Master",
    masterDesc: "Administrator login",
    tutor: "Tutor Area",
    tutorDesc: "Access with tutor code",
    player: "Player",
    playerDesc: "Join the adventure",
  },
  es: {
    title: "Elige tu perfil",
    subtitle: "Accede al espacio adaptado a tu rol",
    master: "Director de Juego",
    masterDesc: "Inicio de sesión de administrador",
    tutor: "Espacio Tutor",
    tutorDesc: "Acceso con código de tutor",
    player: "Jugador",
    playerDesc: "Únete a la aventura",
  },
  ar: {
    title: "اختر ملفك الشخصي",
    subtitle: "الوصول إلى المساحة المناسبة لدورك",
    master: "سيد اللعبة",
    masterDesc: "تسجيل دخول المسؤول",
    tutor: "مساحة الموجه",
    tutorDesc: "الدخول باستخدام رمز الموجه",
    player: "لاعب",
    playerDesc: "انضم إلى المغامرة",
  },
  cn: {
    title: "选择您的身份",
    subtitle: "访问适合您角色的区域",
    master: "游戏导师",
    masterDesc: "管理员登录",
    tutor: "导师空间",
    tutorDesc: "使用导师代码登录",
    player: "玩家",
    playerDesc: "加入冒险",
  },
  ru: {
    title: "Выберите ваш профиль",
    subtitle: "Войдите в раздел, соответствующий вашей роли",
    master: "Мастер игры",
    masterDesc: "Вход для администратора",
    tutor: "Раздел наставника",
    tutorDesc: "Вход по коду наставника",
    player: "Игрок",
    playerDesc: "Присоединиться к приключению",
  },
};

/* Sélecteur de langues : grands boutons sur une seule ligne */
function CenteredLanguagePicker() {
  const { lang, setLang, languages } = useLanguage();
  return (
    <div className="flex flex-wrap sm:flex-nowrap justify-center items-center gap-2 sm:gap-3 w-full max-w-5xl mx-auto py-2 px-2">
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold border-2 whitespace-nowrap transition-all ${
            lang === l.code
              ? "border-gold bg-gold/20 text-gold-bright scale-105 shadow-md shadow-gold/10"
              : "border-void-border bg-void/50 text-parchment hover:border-white/40 hover:bg-void/70"
          }`}
        >
          <span className="text-base sm:text-xl">{l.flag}</span> {l.label}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Sélection automatique des textes du modal selon la langue choisie (Fallback en 'fr')
  const modalText = ROLE_MODAL_TEXTS[lang] || ROLE_MODAL_TEXTS.fr;

  return (
    <div className="relative overflow-x-hidden min-h-screen w-screen">
      {/* Animation des Étoiles */}
      <StarsBackground />

      {/* ---- Hero / Écran d'accueil unique ---- */}
      <section
        className="relative z-10 flex flex-col items-center justify-center px-6 min-h-screen py-10 text-center"
        style={{
          backgroundImage: "url(/images/hero-background.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Voile sombre */}
        <div className="absolute inset-0" style={{ background: "rgba(10,8,20,0.5)" }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.25, rotate: -200 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <MagiQoWordmark />
        </motion.div>

        {/* Slogan principal */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="relative z-10 font-display text-2xl sm:text-3xl text-parchment mt-6 max-w-2xl"
        >
          {t("home_slogan_main")}
        </motion.p>

        {/* Positionnement */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 text-gold-bright text-lg sm:text-xl font-semibold mt-4 max-w-xl"
        >
          {t("home_positioning")}
        </motion.p>

        {/* Sélecteur de langues sur une ligne */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="relative z-10 mt-8 w-full">
          <CenteredLanguagePicker />
        </motion.div>

        {/* Bouton principal -> Ouvre le Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, type: "spring" }}
          className="relative z-10 mt-8"
        >
          <div className="absolute inset-1 rounded-xl bg-gold/15 blur-md pointer-events-none" />
          <button
            onClick={() => setShowRoleModal(true)}
            className="relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-display font-bold text-lg bg-gradient-to-b from-gold-bright to-gold text-void shadow-seal hover:brightness-110 hover:scale-105 transition-all cursor-pointer"
          >
            {t("home_enter_cta")}
          </button>
        </motion.div>
      </section>

      {/* ---- MODAL CHOIX DE RÔLE SANS ERREUR DE CLÉ ---- */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-void-panel border border-gold/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl"
            >
              {/* Bouton de fermeture */}
              <button
                onClick={() => setShowRoleModal(false)}
                className="absolute top-4 right-4 text-parchment/60 hover:text-gold-bright text-xl font-bold p-2 cursor-pointer"
              >
                ✕
              </button>

              <h2 className="font-display text-2xl sm:text-3xl text-gold-bright mb-2">
                {modalText.title}
              </h2>
              <p className="text-parchment/70 text-sm mb-8">
                {modalText.subtitle}
              </p>

              {/* Cartes de rôles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Maître du jeu */}
                <button
                  onClick={() => navigate("/login")}
                  className="flex flex-col items-center p-5 rounded-2xl bg-void/60 border border-void-border hover:border-gold hover:bg-gold/10 transition-all group cursor-pointer"
                >
                  <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">👑</span>
                  <span className="font-display font-bold text-parchment group-hover:text-gold-bright text-base mb-1">
                    {modalText.master}
                  </span>
                  <span className="text-xs text-parchment/60">
                    {modalText.masterDesc}
                  </span>
                </button>

                {/* 2. Tuteur */}
                <button
                  onClick={() => navigate("/parent")}
                  className="flex flex-col items-center p-5 rounded-2xl bg-void/60 border border-void-border hover:border-gold hover:bg-gold/10 transition-all group cursor-pointer"
                >
                  <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">🗝️</span>
                  <span className="font-display font-bold text-parchment group-hover:text-gold-bright text-base mb-1">
                    {modalText.tutor}
                  </span>
                  <span className="text-xs text-parchment/60">
                    {modalText.tutorDesc}
                  </span>
                </button>

                {/* 3. Joueur */}
                <button
                  onClick={() => navigate("/play")}
                  className="flex flex-col items-center p-5 rounded-2xl bg-void/60 border border-void-border hover:border-gold hover:bg-gold/10 transition-all group cursor-pointer"
                >
                  <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎮</span>
                  <span className="font-display font-bold text-parchment group-hover:text-gold-bright text-base mb-1">
                    {modalText.player}
                  </span>
                  <span className="text-xs text-parchment/60">
                    {modalText.playerDesc}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}