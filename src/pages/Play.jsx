import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ParcoursCodeEntry from "@/components/game/ParcoursCodeEntry";
import TicketEntry from "@/components/game/TicketEntry";
import PlayerNameForm from "@/components/game/PlayerNameForm";
import PlayerCodeIntro from "@/components/game/PlayerCodeIntro";
import ChooseCardScreen from "@/components/game/ChooseCardScreen";
import CardXpResultScreen from "@/components/game/CardXpResultScreen";
import RiddleStep from "@/components/game/RiddleStep";
import StarsBackground from "@/components/game/StarsBackground";
import Timer from "@/components/game/Timer";
import ObjectCard from "@/components/game/ObjectCard";
import CodeEntry from "@/components/game/CodeEntry";
import RevealCard from "@/components/game/RevealCard";
import VictoryScreen from "@/components/game/VictoryScreen";
import PhotoChallenge from "@/components/game/PhotoChallenge";
import CollectionModal from "@/components/game/CollectionModal";
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
import { resolveStops, resolveRiddles, RiddleTypes, Quests, PlayerTickets, ParcoursTypes, Cards, PlayerCards } from "@/lib/db";
import { calculateScore, getBadge } from "@/lib/gameData";
import { useLanguage } from "@/lib/LanguageContext";
import { validateAnyLicense, isUnlimited } from "@/lib/license";
import { findOrCreatePlayer, applyXpToCard, computeXpGained } from "@/lib/cardProgression";

// Chaque interfaceArchetype (voir lib/worlds.js) peut fournir ses propres
// variantes des écrans de jeu. Un archétype sans entrée ici, ou une entrée
// sans une clé donnée, retombe sur le composant par défaut correspondant.
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

function normalizeStop(o) {
  return {
    ...o,
    displayName: o.fantasy_name || o.real_name || o.name,
    entryCode: o.object_id || o.code,
  };
}

const phaseVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export default function Play() {
  const { t, setLang } = useLanguage();
  // Le joueur saisit d'abord le code du parcours ("code") : c'est ce qui
  // permet de déterminer la langue de jeu et si un ticket/une carte
  // Personnage sont requis, AVANT de demander quoi que ce soit d'autre.
  const [phase, setPhase] = useState("code"); // code | ticket | name | player-code-intro | choose-card | riddle | object | reveal | card-xp-result | victory
  const [ticketRequired, setTicketRequired] = useState(false);
  const [parent, setParent] = useState(null);
  const [parcours, setParcoursData] = useState(null);
  const [player, setPlayer] = useState(null);
  // Séquence de jeu unifiée : mélange librement devinettes et objets/lieux/
  // animaux, dans l'ordre choisi par le Maître du Jeu. Chaque entrée :
  // { kind: "stop" | "riddle", data }.
  const [sequence, setSequence] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [codeError, setCodeError] = useState(null);
  const [collectionOpen, setCollectionOpen] = useState(false);

  // ---- Système de cartes Personnage (XP/niveau/rareté) -------------------
  // Un type de parcours peut être lié à un univers de cartes (voir
  // ParcoursTypesManager.jsx). Si c'est le cas, le joueur choisit UN
  // personnage avant de commencer, et cette carte gagne de l'XP à la fin du
  // parcours selon le temps économisé — voir lib/cardProgression.js.
  const [cardUniverseSlug, setCardUniverseSlug] = useState("");
  const [availableCards, setAvailableCards] = useState([]);
  const [playerCardLevels, setPlayerCardLevels] = useState({});
  const [chosenCardId, setChosenCardId] = useState(null);
  const [cardXpResult, setCardXpResult] = useState(null); // { card, previousLevel, newLevel, xpGained }
  const hasCollectibleCards = !!cardUniverseSlug;

  const [elapsed, setElapsed] = useState(0);
  const [penaltyCount, setPenaltyCount] = useState(0);
  const [suspended, setSuspended] = useState(false);
  const [suspendedRemaining, setSuspendedRemaining] = useState(0);
  const [errorsSinceSuspend, setErrorsSinceSuspend] = useState(0);
  const startRef = useRef(null);

  function handleTicketValidated() {
    setPhase("name");
  }

  async function handleParcoursSelect(foundParent, foundParcours) {
    const [resolved, resolvedRiddles, riddleTypes, parcoursTypes] = await Promise.all([
      resolveStops(foundParcours.object_ids),
      resolveRiddles(foundParcours.riddle_ids || []),
      RiddleTypes.list(),
      ParcoursTypes.list(),
    ]);
    const typeLabel = (slug) => riddleTypes.find((rt) => rt.slug === slug)?.label || "";
    const stopsById = new Map(resolved.map((o) => [o.id, normalizeStop(o)]));
    const riddlesById = new Map(resolvedRiddles.map((r) => [r.id, { ...r, category: typeLabel(r.riddle_type) }]));

    // Ordre de jeu : celui choisi dans le Créateur de Parcours
    // (foundParcours.sequence). Repli pour les parcours créés AVANT
    // l'introduction de l'ordonnancement combiné : toutes les devinettes
    // d'abord, puis tous les objets/lieux/animaux.
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

    // Univers de cartes lié au TYPE de ce parcours (voir
    // ParcoursTypesManager.jsx) — détermine si un personnage doit être
    // choisi avant de jouer.
    const matchingType = parcoursTypes.find((pt) => pt.slug === foundParcours.parcours_type);
    setCardUniverseSlug(matchingType?.card_universe || "");

    // On valide la licence une seule fois, avant de décider à la fois de la
    // langue et du besoin de ticket.
    let licenseCheck = null;
    if (foundParcours.license_code) {
      try {
        licenseCheck = await validateAnyLicense(foundParcours.license_code);
      } catch {
        licenseCheck = null;
      }
    }
    const isForfaitaire = !!(licenseCheck?.valid && isUnlimited(licenseCheck.maxPlayers));

    // La langue de jeu suit le tuteur propriétaire du parcours — SAUF pour
    // une licence forfaitaire, où l'on respecte la langue déjà choisie par
    // le joueur sur la page d'accueil de MagiQo.
    if (!isForfaitaire && foundParent?.language) setLang(foundParent.language.toLowerCase());

    // Le ticket joueur n'est requis que pour les licences NON forfaitaires
    // qui ont effectivement généré des tickets pour cette organisation.
    let needsTicket = false;
    if (!isForfaitaire && licenseCheck?.valid) {
      const tickets = await PlayerTickets.filter({ license_code: foundParcours.license_code });
      needsTicket = tickets.length > 0;
    }
    setTicketRequired(needsTicket);
    setPhase(needsTicket ? "ticket" : "name");
  }

  // Démarre effectivement la partie (chrono + première étape) : appelé une
  // fois que le joueur a fini toutes les étapes préalables (nom, éventuel
  // choix de carte) — le temps passé sur CES écrans-là ne doit pas compter
  // contre le joueur.
  function beginGameplay() {
    setStepIndex(0);
    startRef.current = Date.now();
    setPhase(sequence[0]?.kind === "riddle" ? "riddle" : "object");
  }

  async function handlePlayerSubmit({ name, level, code }) {
    // Si ce parcours n'est lié à aucun univers de cartes, la notion de
    // "code personnel"/collection n'a aucun sens ici : on ne crée pas de
    // compte joueur inutile (voir hasCollectibleCards, qui masque aussi le
    // champ correspondant dans PlayerNameForm).
    if (!hasCollectibleCards) {
      setPlayer({ name, level });
      beginGameplay();
      return;
    }

    // Le compte joueur (prénom + code personnel) a une collection
    // UNIVERSELLE — voir lib/cardProgression.js. Un code fourni mais
    // introuvable n'est jamais silencieusement remplacé par un nouveau
    // profil : on affiche une erreur claire pour éviter de mélanger deux
    // enfants différents.
    const { player: foundPlayer, isNew, error } = await findOrCreatePlayer({ name, code, licenseCode: parcours?.license_code });
    if (error === "code_not_found") {
      setCodeError(true);
      return;
    }
    setCodeError(null);
    setPlayer({ name, level, id: foundPlayer.id, code: foundPlayer.code });

    // Charge les cartes de l'univers lié + le niveau déjà atteint par ce
    // joueur sur chacune (pour les afficher dans ChooseCardScreen).
    const [cards, ownedCards] = await Promise.all([
      Cards.filter({ universe: cardUniverseSlug, license_code: parcours.license_code, is_active: true }),
      PlayerCards.filter({ player_id: foundPlayer.id }),
    ]);
    setAvailableCards(cards);
    const levels = {};
    ownedCards.forEach((oc) => { levels[oc.card_id] = oc.level; });
    setPlayerCardLevels(levels);

    if (isNew) {
      // Un nouveau profil vient d'être créé : on montre son code AVANT de
      // continuer (et pas seulement dans "Ma collection") — sinon il n'a
      // aucun moyen de le retrouver la prochaine fois.
      setPhase("player-code-intro");
    } else if (cards.length > 0) {
      setPhase("choose-card");
    } else {
      beginGameplay();
    }
  }

  function handleCodeIntroContinue() {
    if (availableCards.length > 0) {
      setPhase("choose-card");
    } else {
      beginGameplay();
    }
  }

  function handleCardChosen(cardId) {
    setChosenCardId(cardId);
    beginGameplay();
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
  // Les pénalités de devinette appartiennent désormais à CHAQUE devinette
  // (voir RiddleEditor.jsx / RiddleStep.jsx), plus à un réglage global du
  // parcours — le montant est fourni directement par RiddleStep.
  function handleWrongRiddle(amount) {
    applyPenalty(amount || 0);
  }
  function handleRiddleHintUsed(amount) {
    applyPenalty(amount || 0);
  }

  // Une devinette résolue (bonne réponse ou chrono expiré) déclenche la
  // révélation UNIQUEMENT si elle porte une photo (comme pour un objet/
  // lieu/animal) ; sinon on avance directement.
  function handleRiddleResolved() {
    const current = sequence[stepIndex];
    if (current?.data?.image_url) {
      setPhase("reveal");
    } else {
      goNextStep();
    }
  }

  function handleCodeCorrect() {
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
      license_code: parcours.license_code,
    });

    // Progression de la carte Personnage choisie en début de partie (voir
    // ChooseCardScreen) : XP gagnés selon le temps économisé par rapport au
    // temps prévu du parcours (10 XP max, voir lib/cardProgression.js).
    if (chosenCardId) {
      const chosenCard = availableCards.find((c) => c.id === chosenCardId);
      const plannedSeconds = (parcours.time_limit_minutes || 0) * 60;
      const xpGained = computeXpGained(plannedSeconds, totalTime);
      const result = await applyXpToCard({
        playerId: player.id,
        cardId: chosenCardId,
        xpGained,
        licenseCode: parcours.license_code,
        cardMeta: chosenCard,
      });
      setCardXpResult({ card: chosenCard, ...result });
      setPhase("card-xp-result");
      return;
    }

    setPhase("victory");
  }

  function handleCardXpContinue() {
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
    setCardUniverseSlug("");
    setAvailableCards([]);
    setPlayerCardLevels({});
    setChosenCardId(null);
    setCardXpResult(null);
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

  return (
    // Le World n'est connu qu'une fois le parcours chargé (handleParcoursSelect) ;
    // avant ça (phases ticket/code), worldSlug est undefined et
    // WorldThemeProvider retombe simplement sur le thème par défaut (Grimoire).
    <WorldThemeProvider worldSlug={parcours?.world}>
    <div className="relative min-h-screen overflow-hidden bg-radial-fade">
      <BackgroundComp density={60} />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10">
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
              <PlayerNameForm parcours={parcours} hasCollectibleCards={hasCollectibleCards} onSubmit={handlePlayerSubmit} codeError={codeError} />
            </motion.div>
          )}

          {phase === "player-code-intro" && player?.code && (
            <motion.div key="player-code-intro" variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }} className="w-full">
              <PlayerCodeIntro code={player.code} onContinue={handleCodeIntroContinue} />
            </motion.div>
          )}

          {phase === "choose-card" && (
            <motion.div key="choose-card" variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }} className="w-full">
              <ChooseCardScreen cards={availableCards} playerLevels={playerCardLevels} onChoose={handleCardChosen} />
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
                onHintUsed={handleRiddleHintUsed}
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
              <ActiveRevealCard
                stop={
                  currentEntry.kind === "riddle"
                    ? { displayName: currentRiddle.answer || currentRiddle.question, real_name: "", emoji: "❓", image_url: currentRiddle.image_url }
                    : currentStop
                }
                onContinue={goNextStep}
              />
            </motion.div>
          )}

          {phase === "card-xp-result" && cardXpResult && (
            <motion.div key="card-xp-result" variants={phaseVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }} className="w-full">
              <CardXpResultScreen
                card={cardXpResult.card}
                previousLevel={cardXpResult.previousLevel}
                newLevel={cardXpResult.newLevel}
                xpGained={cardXpResult.xpGained}
                onContinue={handleCardXpContinue}
              />
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
          onClose={() => setCollectionOpen(false)}
        />
      )}
    </div>
    </WorldThemeProvider>
  );
}
