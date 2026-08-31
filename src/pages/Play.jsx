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
import CommanderCard from "@/components/game/CommanderCard";
import CollectionModal from "@/components/game/CollectionModal";
import { computeCardLevel } from "@/lib/commanderCardThemes";
import { findOrCreatePlayer, recordCardObtained } from "@/lib/collection";

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
  const [phase, setPhase] = useState("code"); // code | ticket | name | riddle | object | reveal | victory
  const [ticketRequired, setTicketRequired] = useState(false);
  const [parent, setParent] = useState(null);
  const [parcours, setParcoursData] = useState(null);
  const [player, setPlayer] = useState(null);
  // Séquence de jeu unifiée : mélange librement devinettes et objets/lieux/
  // animaux, dans l'ordre choisi par le Maître du Jeu au moment de la
  // création du parcours (ex : 1 devinette → 2 lieux → 3 devinettes...).
  // Chaque entrée : { kind: "stop" | "riddle", data }.
  const [sequence, setSequence] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  // Niveau calculé pour la carte Commandant en cours de révélation (voir
  // handleRiddleResolved) — dépend de la performance du joueur sur CETTE
  // devinette précise, pas du score global du parcours.
  const [cardLevel, setCardLevel] = useState(90);
  const [cardStatus, setCardStatus] = useState(null); // 'new' | 'level_up' | 'unchanged'
  const [codeError, setCodeError] = useState(null);
  const [collectionOpen, setCollectionOpen] = useState(false);

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
    const stopsById = new Map(resolved.map((o) => [o.id, normalizeStop(o)]));
    const riddlesById = new Map(resolvedRiddles.map((r) => [r.id, { ...r, category: typeLabel(r.riddle_type) }]));

    // Ordre de jeu : celui choisi dans le Créateur de Parcours
    // (foundParcours.sequence). Repli pour les parcours créés AVANT
    // l'introduction de l'ordonnancement combiné : toutes les devinettes
    // d'abord, puis tous les objets/lieux/animaux — comportement
    // strictement identique à l'ancien système, rien ne change pour eux.
    const rawSequence =
      foundParcours.sequence?.length > 0
        ? foundParcours.sequence
        : [
            ...(foundParcours.riddle_ids || []).map((id) => ({ type: "riddle", id })),
            ...(foundParcours.object_ids || []).map((id) => ({ type: "stop", id })),
          ];

    const builtSequence = rawSequence
      .map((entry) => {
        if (entry.type === "riddle") return riddlesById.has(entry.id) ? { kind: "riddle", data: riddlesById.get(entry.id) } : null;
        return stopsById.has(entry.id) ? { kind: "stop", data: stopsById.get(entry.id) } : null;
      })
      .filter(Boolean);

    setParent(foundParent);
    setParcoursData(foundParcours);
    setSequence(builtSequence);

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

  async function handlePlayerSubmit({ name, level, code }) {
    // Le compte joueur (prénom + code personnel) est scopé à la licence du
    // PARCOURS joué — voir lib/collection.js. Un code fourni mais introuvable
    // n'est jamais silencieusement remplacé par un nouveau profil : on
    // affiche une erreur claire pour éviter de mélanger deux enfants
    // différents dans une même collection.
    const licenseCode = parcours?.license_code;
    const { player: foundPlayer, error } = await findOrCreatePlayer({ name, code, licenseCode });
    if (error === "code_not_found") {
      setCodeError(true);
      return;
    }
    setCodeError(null);
    setPlayer({ name, level, id: foundPlayer.id, code: foundPlayer.code });
    setStepIndex(0);
    setPhase(sequence[0]?.kind === "riddle" ? "riddle" : "object");
    startRef.current = Date.now();
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

  // Une devinette résolue (bonne réponse ou chrono expiré) déclenche :
  //  - la carte Commandant si elle en porte une (niveau calculé selon la
  //    performance du joueur sur CETTE devinette précise, voir
  //    computeCardLevel, PUIS confronté à la collection persistante du
  //    joueur — voir recordCardObtained : le meilleur niveau jamais atteint
  //    est conservé, avec un petit bonus à chaque doublon) ;
  //  - sinon la révélation simple si elle a une photo (comme demandé :
  //    "comme les objets, les lieux et les animaux") ;
  //  - sinon on avance directement, sans écran intermédiaire.
  async function handleRiddleResolved(meta = {}) {
    const current = sequence[stepIndex];
    if (current?.data?.has_character_card) {
      const freshLevel = computeCardLevel(meta);
      const { card, status } = await recordCardObtained({
        playerId: player.id,
        riddle: current.data,
        computedLevel: freshLevel,
        licenseCode: parcours.license_code,
      });
      setCardLevel(card.level);
      setCardStatus(status);
      setPhase("card-reveal");
    } else if (current?.data?.image_url) {
      setPhase("reveal");
    } else {
      goNextStep();
    }
  }

  function handleCodeCorrect() {
    // Reward moment: the real photo is hidden throughout the riddle and only
    // revealed once the code has actually been solved.
    setPhase("reveal");
  }

  async function finishQuest() {
    const totalTime = Math.round((Date.now() - startRef.current) / 1000);
    const score = calculateScore(totalTime, penaltyCount, sequence.length);
    const badge = getBadge(score);
    const discoveredStopIds = sequence.filter((s) => s.kind === "stop").map((s) => s.data.id);
    await Quests.create({
      name: parcours.magic_name || parcours.name,
      player_name: player.name,
      difficulty: player.level,
      selected_objects: discoveredStopIds,
      status: "completed",
      started_at: new Date(startRef.current).toISOString(),
      completed_at: new Date().toISOString(),
      total_time_seconds: totalTime,
      penalty_count: penaltyCount,
      score,
      badge,
      current_step: sequence.length,
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
    if (stepIndex + 1 < sequence.length) {
      const next = stepIndex + 1;
      setStepIndex(next);
      setPhase(sequence[next].kind === "riddle" ? "riddle" : "object");
    } else {
      await finishQuest();
    }
  }

  function replay() {
    setPhase("code");
    setParent(null);
    setParcoursData(null);
    setPlayer(null);
    setSequence([]);
    setStepIndex(0);
    setElapsed(0);
    setPenaltyCount(0);
    setSuspended(false);
    setErrorsSinceSuspend(0);
    setCollectionOpen(false);
    setCodeError(null);
  }

  const currentEntry = sequence[stepIndex];
  const currentStop = currentEntry?.kind === "stop" ? currentEntry.data : null;
  const currentRiddle = currentEntry?.kind === "riddle" ? currentEntry.data : null;
  const world = getWorld(parcours?.world);
  const archetype = ARCHETYPE_COMPONENTS[world.interfaceArchetype];
  const BackgroundComp = archetype?.Background || StarsBackground;
  const ActiveObjectCard = archetype?.ObjectCardVariant || ObjectCard;
  const ActiveCodeEntry = archetype?.CodeEntryVariant || CodeEntry;
  const ActiveRevealCard = archetype?.RevealCardVariant || RevealCard;
  const ActiveVictoryScreen = archetype?.VictoryScreenVariant || VictoryScreen;
  const totalTimeForVictory = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 0;
  // Une devinette avec photo se révèle exactement comme un objet/lieu/animal :
  // on construit un "stop" éphémère à partir de la devinette pour réutiliser
  // tel quel le même ActiveRevealCard (même archétype, même habillage).
  const revealSubject =
    currentEntry?.kind === "riddle"
      ? { displayName: currentRiddle.answer || currentRiddle.question, real_name: "", emoji: "❓", image_url: currentRiddle.image_url }
      : currentStop;

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
              <PlayerNameForm parcours={parcours} onSubmit={handlePlayerSubmit} codeError={codeError} />
            </motion.div>
          )}

          {phase === "riddle" && currentRiddle && (
            <motion.div
              key={`riddle-${stepIndex}`}
              variants={phaseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="w-full flex flex-col items-center"
            >
              <Timer elapsed={elapsed} penaltyCount={penaltyCount} suspended={suspended} suspendedRemaining={suspendedRemaining} />
              <RiddleStep
                riddle={currentRiddle}
                stepNumber={stepIndex + 1}
                totalSteps={sequence.length}
                onResolved={handleRiddleResolved}
                onWrong={handleWrongRiddle}
                timeLimitSeconds={parcours.riddle_time_limit_seconds || 0}
              />
            </motion.div>
          )}

          {phase === "card-reveal" && currentRiddle && (
            <motion.div key={`card-${stepIndex}`} variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }} className="w-full">
              <CommanderCard riddle={currentRiddle} level={cardLevel} status={cardStatus} onContinue={goNextStep} />
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
                  totalSteps={sequence.length}
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

          {phase === "reveal" && currentEntry && (
            <motion.div key={`reveal-${stepIndex}`} variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }} className="w-full">
              <ActiveRevealCard stop={revealSubject} onContinue={goNextStep} />
            </motion.div>
          )}

          {phase === "victory" && (
            <motion.div key="victory" variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }} className="w-full">
              <ActiveVictoryScreen
                result={{ totalTime: totalTimeForVictory, penaltyCount, score: calculateScore(totalTimeForVictory, penaltyCount, sequence.length), badge: getBadge(calculateScore(totalTimeForVictory, penaltyCount, sequence.length)) }}
                onReplay={replay}
              />
              {player?.id && (
                <button
                  onClick={() => setCollectionOpen(true)}
                  className="block mx-auto mt-4 text-sm text-gold-dim hover:text-gold-bright underline underline-offset-4"
                >
                  🎴 {t("coll_view_button")}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {collectionOpen && (
        <CollectionModal
          playerId={player.id}
          playerCode={player.code}
          licenseCode={parcours?.license_code}
          onClose={() => setCollectionOpen(false)}
        />
      )}
    </div>
    </WorldThemeProvider>
  );
}
