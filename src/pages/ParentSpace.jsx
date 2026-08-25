import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, LogOut, Map, History, Sparkles, ScrollText, Users, ShieldAlert } from "lucide-react";
import StarsBackground from "@/components/game/StarsBackground";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import StatCard from "@/components/shared/StatCard";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Misc";
import { Parents, Parcours, Quests } from "@/lib/db";
import { getActiveLicense } from "@/lib/auth";
import { useLanguage } from "@/lib/LanguageContext";
import ParcoursManager from "@/components/parent/ParcoursManager";
import HistoryTable from "@/components/shared/HistoryTable";

const SESSION_KEY = "magiqo:v1:parent_session";

export default function ParentSpace() {
  const { t, setLang } = useLanguage();
  const activeLicense = getActiveLicense();
  const [parent, setParent] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("parcours");
  const [stats, setStats] = useState({ quests: 0, players: 0, avg: 0 });

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) tryLogin(saved, true);
  }, []);

  // Un tuteur a une langue de travail qui lui est propre (voir
  // ParentsManager) : dès qu'il est connecté, l'interface de son espace
  // doit basculer sur cette langue, et non rester sur celle de l'admin ou
  // du visiteur précédent.
  useEffect(() => {
    if (parent?.language) setLang(parent.language.toLowerCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent?.language]);

  useEffect(() => {
    if (!parent) return;
    (async () => {
      const quests = await Quests.filter({ parent_code: parent.parent_code });
      const players = new Set(quests.map((q) => q.player_name)).size;
      const avg = quests.length ? Math.round(quests.reduce((s, q) => s + q.score, 0) / quests.length) : 0;
      setStats({ quests: quests.length, players, avg });
    })();
  }, [parent, tab]);

  async function tryLogin(rawCode, silent = false) {
    const clean = rawCode.trim().toUpperCase();
    const normalized = clean.startsWith("PAR-") ? clean : `PAR-${clean}`;
    const parents = await Parents.filter({ is_active: true });

    // Quotas V22 : Limite de tuteurs
    const maxTutorsAllowed = activeLicense?.maxTutors ?? 2;
    const found = parents.find((p) => p.parent_code?.toUpperCase() === normalized || p.parent_code?.toUpperCase() === clean);

    if (!found) {
      if (parents.length >= maxTutorsAllowed) {
        if (!silent) setError(`Limite de licence atteinte : maximum ${maxTutorsAllowed} tuteur(s) autorisé(s).`);
        return;
      }
      if (!silent) setError(t("parent_login_error"));
      return;
    }

    setParent(found);
    sessionStorage.setItem(SESSION_KEY, found.parent_code);
  }

  function logout() {
    setParent(null);
    sessionStorage.removeItem(SESSION_KEY);
  }

  const maxPlayersAllowed = activeLicense?.maxPlayers ?? 10;
  const isPlayerLimitReached = stats.players >= maxPlayersAllowed;

  return (
    <div className="relative min-h-screen overflow-hidden bg-radial-fade">
      <StarsBackground density={50} />
      <div className="relative z-10 flex items-center justify-between p-5">
        {!parent ? (
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-void-panel/70 border border-void-border text-parchment hover:border-gold-dim hover:text-gold-bright transition-colors text-sm font-semibold"
          >
            <ArrowLeft size={18} /> {t("common_back_home")}
          </Link>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {parent && (
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut size={15} /> {t("common_logout")}
            </Button>
          )}
          <LanguageSwitcher />
        </div>
      </div>

      <div className="relative z-10 px-4 pb-16">
        {!parent ? (
          <div className="max-w-md mx-auto mt-10">
            <Card>
              <CardContent>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-arcane/15 flex items-center justify-center border border-arcane-dim/40">
                    <KeyRound className="text-arcane" size={20} />
                  </div>
                  <h1 className="font-display text-xl text-parchment">{t("parent_login_title")}</h1>
                </div>
                <Label>{t("parent_login_code")}</Label>
                <Input
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && tryLogin(code)}
                  placeholder={t("parent_login_placeholder")}
                  className="text-center font-rune text-xl tracking-widest uppercase py-4"
                />
                {error && <p className="text-ember-bright text-sm mt-2">{error}</p>}
                <Button className="w-full mt-5" disabled={!code} onClick={() => tryLogin(code)}>
                  {t("parent_login_enter")}
                </Button>
                <p className="text-muted text-xs text-center mt-4">{t("parent_login_new")}</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="text-gold" size={26} />
                <h1 className="font-display text-2xl text-gold-bright">
                  {t("parent_welcome")}, {parent.first_name} !
                </h1>
              </div>

              {/* Récapitulatif licence V22 */}
              {activeLicense && (
                <div className="flex items-center gap-2 text-xs bg-void/60 border border-white/10 px-3 py-1.5 rounded-xl text-muted">
                  <Users size={14} className="text-arcane" />
                  <span>Joueurs : <strong className={isPlayerLimitReached ? "text-ember-bright" : "text-parchment"}>{stats.players}/{maxPlayersAllowed}</strong></span>
                  <span>• Tuteurs max : <strong className="text-parchment">{activeLicense.maxTutors}</strong></span>
                </div>
              )}
            </div>

            {/* Avertissement visuel si le quota de joueurs est atteint */}
            {isPlayerLimitReached && (
              <div className="mb-6 p-3 bg-ember/15 border border-ember/30 rounded-xl flex items-center gap-2 text-xs text-ember-bright">
                <ShieldAlert size={16} className="shrink-0" />
                <span>Limite atteinte : cette licence est restreinte à {maxPlayersAllowed} joueur(s) maximum.</span>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <StatCard icon={<Map size={20} />} label={t("parent_stats_quests")} value={stats.quests} accent="arcane" />
              <StatCard icon={<Sparkles size={20} />} label={t("parent_stats_players")} value={`${stats.players} / ${maxPlayersAllowed}`} accent={isPlayerLimitReached ? "ember" : "gold"} />
              <StatCard icon={<ScrollText size={20} />} label={t("parent_stats_avg")} value={stats.avg} accent="emerald" />
            </div>

            <Tabs
              className="mb-6"
              tabs={[
                { value: "parcours", label: t("parent_tab_parcours"), icon: <Map size={15} /> },
                { value: "history", label: t("parent_tab_history"), icon: <History size={15} /> },
              ]}
              active={tab}
              onChange={setTab}
            />

            {tab === "parcours" && (
              <ParcoursManager
                scopeParentCode={parent.parent_code}
                parentInfo={{
                  parent_first_name: parent.first_name,
                  parent_last_name: parent.last_name,
                  parent_code: parent.parent_code,
                  parent_language: parent.language,
                }}
                maxPlayers={maxPlayersAllowed}
                isPlayerLimitReached={isPlayerLimitReached}
              />
            )}
            {tab === "history" && <HistoryTable scopeParentCode={parent.parent_code} />}
          </motion.div>
        )}
      </div>
    </div>
  );
}