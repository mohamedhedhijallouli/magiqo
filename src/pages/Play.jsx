import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import StarsBackground from "@/components/game/StarsBackground";
import MagiQoLogo from "@/components/game/MagiQoLogo";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import TicketEntry from "@/components/game/TicketEntry";
import ParcoursCodeEntry from "@/components/game/ParcoursCodeEntry";
import PlayerNameForm from "@/components/game/PlayerNameForm";
import RiddleStep from "@/components/game/RiddleStep";
import ObjectCard from "@/components/game/ObjectCard";
import CodeEntry from "@/components/game/CodeEntry";
import RevealCard from "@/components/game/RevealCard";
import Timer from "@/components/game/Timer";
import VictoryScreen from "@/components/game/VictoryScreen";
import { resolveStops, resolveRiddles, RiddleTypes, Quests, PlayerTickets } from "@/lib/db";
import { calculateScore, getBadge } from "@/lib/gameData";
import { useLanguage } from "@/lib/LanguageContext";
import { validateAnyLicense, isUnlimited } from "@/lib/license";
import PhotoChallenge from "@/components/game/PhotoChallenge";
import { WorldThemeProvider } from "@/lib/WorldThemeContext";
import { getWorld } from "@/lib/worlds";
import DossierBackground from "@/components/game/archetypes/dossier/DossierBackground";
import DossierObjectCard from "@/components/game/archetypes/dossier/DossierObjectCard";
import DossierCodeEntry from "@/components/game/archetypes/dossier/DossierCodeEntry";
import DossierRevealCard from "@/components/game/archetypes/dossier/DossierRevealCard";
import DossierVictoryScreen from "@/components/game/archetypes/dossier/DossierVictoryScreen";
import MapBackground from "@/components/game/archetypes/map/MapBackground";
import MapObjectCard from "@/components/game/archetypes/map/MapObjectCard";
import MapCodeEntry from "@/components/game/archetypes/map/MapCodeEntry";
import MapRevealCard from "@/components/game/archetypes/map/MapRevealCard";
import MapVictoryScreen from "@/components/game/archetypes/map/MapVictoryScreen";
import NotebookBackground from "@/components/game/archetypes/notebook/NotebookBackground";
import NotebookObjectCard from "@/components/game/archetypes/notebook/NotebookObjectCard";
import NotebookCodeEntry from "@/components/game/archetypes/notebook/NotebookCodeEntry";
import NotebookRevealCard from "@/components/game/archetypes/notebook/NotebookRevealCard";
import NotebookVictoryScreen from "@/components/game/archetypes/notebook/NotebookVictoryScreen";
import ArenaBackground from "@/components/game/archetypes/arena/ArenaBackground";
import ArenaObjectCard from "@/components/game/archetypes/arena/ArenaObjectCard";
import ArenaCodeEntry from "@/components/game/archetypes/arena/ArenaCodeEntry";
import ArenaRevealCard from "@/components/game/archetypes/arena/ArenaRevealCard";
import ArenaVictoryScreen from "@/components/game/archetypes/arena/ArenaVictoryScreen";
import DashboardBackground from "@/components/game/archetypes/dashboard/DashboardBackground";
import DashboardObjectCard from "@/components/game/archetypes/dashboard/DashboardObjectCard";
import DashboardCodeEntry from "@/components/game/archetypes/dashboard/DashboardCodeEntry";
import DashboardRevealCard from "@/components/game/archetypes/dashboard/DashboardRevealCard";
import DashboardVictoryScreen from "@/components/game/archetypes/dashboard/DashboardVictoryScreen";

// Chaque interfaceArchetype (voir lib/worlds.js) peut fournir ses propres
// variantes des écrans de jeu. Un archétype sans entrée ici, ou une entrée
// sans une clé donnée, retombe sur le composant par défaut correspondant
// (StarsBackground / ObjectCard / CodeEntry / RevealCard / VictoryScreen)
// — c'est ce qui permet d'ajouter nettement plus de Worlds que d'archétypes
// sans jamais toucher à Play.jsx. "map" est partagé par 4 Worlds (Carte au
// Trésor, Carte du Capitaine, Parchemin du Royaume, City Explorer) : seule
// leur palette change (worlds.js), la mise en page est commune.
const ARCHETYPE_COMPONENTS = {
  dossier: {
    Background: DossierBackground,
    ObjectCardVariant: DossierObjectCard,
    CodeEntryVariant: DossierCodeEntry,
    RevealCardVariant: DossierRevealCard,
    VictoryScreenVariant: DossierVictoryScreen,
  },
  map: {
    Background: MapBackground,
    ObjectCardVariant: MapObjectCard,
    CodeEntryVariant: MapCodeEntry,
    RevealCardVariant: MapRevealCard,
    VictoryScreenVariant: MapVictoryScreen,
  },
  notebook: {
    Background: NotebookBackground,
    ObjectCardVariant: NotebookObjectCard,
    CodeEntryVariant: NotebookCodeEntry,
    RevealCardVariant: NotebookRevealCard,
    VictoryScreenVariant: NotebookVictoryScreen,
  },
  arena: {
    Background: ArenaBackground,
    ObjectCardVariant: ArenaObjectCard,
    CodeEntryVariant: ArenaCodeEntry,
    RevealCardVariant: ArenaRevealCard,
    VictoryScreenVariant: ArenaVictoryScreen,
  },
  dashboard: {
    Background: DashboardBackground,
    ObjectCardVariant: DashboardObjectCard,
    CodeEntryVariant: DashboardCodeEntry,
    RevealCardVariant: DashboardRevealCard,
    VictoryScreenVariant: DashboardVictoryScreen,
  },
};

const phaseVariants = {
  initial: { opacity: 0, y: 28, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.97 },
};

// A stop can come from GameObjects (object_id), Animals or Places (code) —
// this normalizes the field so the rest of the flow never has to care which.
function normalizeStop(stop) {
  return {
    ...stop,
    displayName: stop.fantasy_name || stop.magic_name || stop.gaming_name || stop.real_name,
    entryCode: stop.object_id || stop.code,
  };
}

export default function Play() {
  const { t, setLang } = useLanguage();
  // Le joueur saisit d'abord le code du parcours ("code") : c'est ce qui
  // permet de déterminer la langue de jeu (héritée du tuteur propriétaire
  // du parcours) et si un ticket joueur est requis, AVANT de demander quoi
  // que ce soit d'autre. Le ticket n'est ensuite demandé que si la licence
  // du Maître du Jeu n'est pas forfaitaire (joueurs illimités) — voir
  // handleParcoursSelect.
  const [phase, setPhase] = useState("code"); // code | ticket | name | riddles | object | reveal | victory
  const [ticketRequired, setTicketRequired] = useState(false);
  const [parent, setParent] = useState(null);
  const [parcours, setParcoursData] = useState(null);
  const [player, setPlayer] = useState(null);
  const [stops, setStops] = useState([]);
  const [riddleSet, setRiddleSet] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);

  const [elapsed, setElapsed] = useState(0);
  const [penaltyCount, setPenaltyCount] = useState(0);
  const [suspended, setSuspended] = useState(false);
  const [suspendedRemaining, setSuspendedRemaining] = useState(0);
  const [errorsSinceSuspend, setErrorsSinceSuspend] = useState(0);
  const startRef = useRef(null);

  function handleTicketValidated() {
    setPhase("name");
  }

  useEffect(() => {
    if (phase !== "object" && phase !== "riddles") return;
    if (suspended) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [phase, suspended]);

  useEffect(() => {
    if (!suspended) return;
    if (suspendedRemaining <= 0) {
      setSuspended(false);
      return;
    }
    const id = setTimeout(() => setSuspendedRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [suspended, suspendedRemaining]);

  async function handleParcoursSelect(foundParent, foundParcours) {
    const [resolved, resolvedRiddles, riddleTypes] = await Promise.all([
      resolveStops(foundParcours.object_ids),
      resolveRiddles(foundParcours.riddle_ids || []),
      RiddleTypes.list(),
    ]);
    const typeLabel = (slug) => riddleTypes.find((rt) => rt.slug === slug)?.label || "";
    setParent(foundParent);
    setParcoursData(foundParcours);
    setStops(resolved.map(normalizeStop));
    setRiddleSet(resolvedRiddles.map((r) => ({ ...r, category: typeLabel(r.riddle_type) })));

    // La langue de jeu est celle du tuteur propriétaire du parcours — c'est
    // tout l'intérêt de connaître le parcours avant de demander quoi que ce
    // soit d'autre au joueur (nom, ticket...) : le reste de la session se
    // déroule dans la bonne langue dès la prochaine étape.
    if (foundParent?.language) setLang(foundParent.language.toLowerCase());

    // Le ticket joueur n'est requis que pour les licences NON forfaitaires
    // (nombre de joueurs limité — voir lib/license.js) qui ont
    // effectivement généré des tickets pour cette organisation. Une licence
    // forfaitaire (joueurs illimités) n'a pas besoin de ce contrôle, et un
    // Maître du Jeu qui n'a jamais utilisé cette fonctionnalité optionnelle
    // ne doit pas se retrouver bloqué dessus.
    let needsTicket = false;
    if (foundParcours.license_code) {
      try {
        const licenseCheck = await validateAnyLicense(foundParcours.license_code);
        if (licenseCheck.valid && !isUnlimited(licenseCheck.maxPlayers)) {
          const tickets = await PlayerTickets.filter({ license_code: foundParcours.license_code });
          needsTicket = tickets.length > 0;
        }
      } catch {
        needsTicket = false; // en cas de doute, ne pas bloquer le joueur
      }
    }
    setTicketRequired(needsTicket);
    setPhase(needsTicket ? "ticket" : "name");
  }

  // V26 — Les devinettes sont désormais un bloc indépendant des éléments à
  // trouver, choisi une fois pour toutes à la création du parcours : elles
  // sont jouées en un seul bloc, avant les étapes objets/animaux/lieux,
  // plutôt que d'être intercalées étape par étape selon le niveau du joueur.
  function handlePlayerSubmit({ name, level }) {
    setPlayer({ name, level });
    setStepIndex(0);
    setPhase(riddleSet.length > 0 ? "riddles" : "object");
    startRef.current = Date.now();
  }

  async function handleRiddlesDone() {
    if (stops.length > 0) {
      setPhase("object");
    } else {
      await finishQuest();
    }
  }

  const applyPenalty = useCallback(
    (seconds) => {
      setElapsed((e) => e + seconds);
      setPenaltyCount((c) => c + 1);
      if (parcours.suspension_after_errors > 0) {
        const next = errorsSinceSuspend + 1;
        if (next >= parcours.suspension_after_errors) {
          setSuspended(true);
          setSuspendedRemaining(parcours.suspension_duration_seconds || 15);
          setErrorsSinceSuspend(0);
        } else {
          setErrorsSinceSuspend(next);
        }
      }
    },
    [parcours, errorsSinceSuspend]
  );

  function handleHintUsed() {
    applyPenalty(parcours.penalty_per_hint_seconds || 60);
  }
  function handleWrongCode() {
    applyPenalty(parcours.penalty_per_wrong_code_seconds || 20);
  }
  function handleWrongRiddle() {
    applyPenalty(parcours.penalty_per_wrong_riddle_seconds || 15);
  }

  function handleCodeCorrect() {
    // Reward moment: the real photo is hidden throughout the riddle and only
    // revealed once the code has actually been solved.
    setPhase("reveal");
  }

  async function finishQuest() {
    const totalTime = Math.round((Date.now() - startRef.current) / 1000);
    const score = calculateScore(totalTime, penaltyCount, stops.length);
    const badge = getBadge(score);
    await Quests.create({
      name: parcours.magic_name || parcours.name,
      player_name: player.name,
      difficulty: player.level,
      selected_objects: stops.map((o) => o.id),
      status: "completed",
      started_at: new Date(startRef.current).toISOString(),
      completed_at: new Date().toISOString(),
      total_time_seconds: totalTime,
      penalty_count: penaltyCount,
      score,
      badge,
      current_step: stops.length,
      parent_code: parent.parent_code,
      parcours_id: parcours.id,
      // Le parcours peut appartenir à une licence différente de celle
      // (éventuellement absente) de l'appareil du joueur : on hérite du
      // license_code du PARCOURS joué, pas de l'appareil.
      license_code: parcours.license_code,
    });
    setPhase("victory");
  }

  async function goNextStep() {
    if (stepIndex + 1 < stops.length) {
      const next = stepIndex + 1;
      setStepIndex(next);
      setPhase("object");
    } else {
      await finishQuest();
    }
  }

  function replay() {
    setPhase("code");
    setParent(null);
    setParcoursData(null);
    setPlayer(null);
    setStops([]);
    setRiddleSet([]);
    setStepIndex(0);
    setElapsed(0);
    setPenaltyCount(0);
    setSuspended(false);
    setErrorsSinceSuspend(0);
  }

  const currentStop = stops[stepIndex];
  const world = getWorld(parcours?.world);
  const archetype = ARCHETYPE_COMPONENTS[world.interfaceArchetype];
  const BackgroundComp = archetype?.Background || StarsBackground;
  const ActiveObjectCard = archetype?.ObjectCardVariant || ObjectCard;
  const ActiveCodeEntry = archetype?.CodeEntryVariant || CodeEntry;
  const ActiveRevealCard = archetype?.RevealCardVariant || RevealCard;
  const ActiveVictoryScreen = archetype?.VictoryScreenVariant || VictoryScreen;
  const totalTimeForVictory = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 0;

  return (
    // Le World n'est connu qu'une fois le parcours chargé (handleParcoursSelect) ;
    // avant ça (phases ticket/code), worldSlug est undefined et
    // WorldThemeProvider retombe simplement sur le thème par défaut (Grimoire).
    <WorldThemeProvider worldSlug={parcours?.world}>
    <div className="relative min-h-screen overflow-hidden bg-radial-fade">
      <BackgroundComp density={60} />
      <div className="relative z-10 flex items-center justify-between p-5">
        <Link to="/" className="flex items-center gap-2 text-muted hover:text-parchment transition-colors">
          <ArrowLeft size={18} />
          <MagiQoLogo size={36} spin={false} />
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 px-4 pb-16 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {phase === "code" && (
            <motion.div key="code" variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }} className="w-full flex flex-col items-center">
              <h1 className="font-display text-2xl text-gold-bright mb-8 text-center">{t("play_join")}</h1>
              <ParcoursCodeEntry onSelect={handleParcoursSelect} />
            </motion.div>
          )}

          {phase === "ticket" && (
            <motion.div key="ticket" variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }} className="w-full flex flex-col items-center">
              <h1 className="font-display text-2xl text-gold-bright mb-8 text-center">{t("play_join")}</h1>
              <TicketEntry onValidated={handleTicketValidated} licenseCode={parcours?.license_code} />
            </motion.div>
          )}

          {phase === "name" && parcours && (
            <motion.div key="name" variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }} className="w-full">
              <PlayerNameForm parcours={parcours} onSubmit={handlePlayerSubmit} />
            </motion.div>
          )}

          {phase === "riddles" && riddleSet.length > 0 && (
            <motion.div
              key="riddles-block"
              variants={phaseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="w-full flex flex-col items-center"
            >
              <Timer elapsed={elapsed} penaltyCount={penaltyCount} suspended={suspended} suspendedRemaining={suspendedRemaining} />
              <RiddleStep
                riddles={riddleSet}
                onDone={handleRiddlesDone}
                onWrong={handleWrongRiddle}
                timeLimitSeconds={parcours.riddle_time_limit_seconds || 0}
              />
            </motion.div>
          )}

          {phase === "object" && currentStop && (
            <motion.div
              key={`object-${stepIndex}`}
              variants={phaseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="w-full flex flex-col items-center"
            >
              <Timer elapsed={elapsed} penaltyCount={penaltyCount} suspended={suspended} suspendedRemaining={suspendedRemaining} />
              <div className="flex flex-col items-center gap-6 w-full">
                <ActiveObjectCard
                  gameObject={currentStop}
                  difficulty={player.level}
                  stepNumber={stepIndex + 1}
                  totalSteps={stops.length}
                  onHintUsed={handleHintUsed}
                />
                {!suspended && (
                  currentStop.validation_mode === "photo_local" || currentStop.validation_mode === "photo_ai" ? (
                    <PhotoChallenge stop={currentStop} onCorrect={handleCodeCorrect} onWrong={handleWrongCode} />
                  ) : (
                    <ActiveCodeEntry expectedCode={currentStop.entryCode} onCorrect={handleCodeCorrect} onWrong={handleWrongCode} />
                  )
                )}
              </div>
            </motion.div>
          )}

          {phase === "reveal" && currentStop && (
            <motion.div key={`reveal-${stepIndex}`} variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }} className="w-full">
              <ActiveRevealCard stop={currentStop} onContinue={goNextStep} />
            </motion.div>
          )}

          {phase === "victory" && (
            <motion.div key="victory" variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }} className="w-full">
              <ActiveVictoryScreen
                result={{ totalTime: totalTimeForVictory, penaltyCount, score: calculateScore(totalTimeForVictory, penaltyCount, stops.length), badge: getBadge(calculateScore(totalTimeForVictory, penaltyCount, stops.length)) }}
                onReplay={replay}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </WorldThemeProvider>
  );
}
