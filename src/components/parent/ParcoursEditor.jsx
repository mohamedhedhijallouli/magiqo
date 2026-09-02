import React, { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, X, Dice5, Search, Layers, Shuffle, HelpCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Input, Label, Textarea, Select, Switch } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { Badge, useToast } from "@/components/ui/Misc";
import { useLanguage } from "@/lib/LanguageContext";
import { Parcours, ParcoursTypes, Riddles, RiddleTypes, Parents, subscribe, generateAccessCode, getAdminActiveLicenseCode } from "@/lib/db";
import { taxonomyLabel } from "@/lib/utils";
import { LEVELS } from "@/lib/gameData";
import { LANGUAGES } from "@/lib/i18n";
import WorldPicker from "@/components/parent/WorldPicker";

const EMPTY = {
  name: "", magic_name: "", description: "", access_code: "", age_group: "apprenti",
  parcours_type: "", world: "grimoire", object_ids: [], riddle_ids: [], sequence: [], is_active: true, time_limit_minutes: 0,
  penalty_per_hint_seconds: 60, penalty_per_wrong_code_seconds: 20,
  penalty_per_wrong_riddle_seconds: 15, riddle_time_limit_seconds: 0,
  suspension_after_errors: 0, suspension_duration_seconds: 15,
  mode: "indoor", parent_code: "",
};

const KIND_ICON = { object: "📦", animal: "🐾", place: "🏛️" };

// Libellés dynamiques selon la famille liée au type de parcours choisi —
// purement pour l'affichage (titre de section, message "rien choisi", texte
// de recherche). Ne filtre JAMAIS les arrêts déjà sélectionnés : voir
// activeKind plus bas, qui ne s'applique qu'aux NOUVEAUX ajouts proposés.
const KIND_LABELS = {
  object: { stopsLabelKey: "pe_objects", emptyKey: "pe_no_objects_selected", searchKey: "pe_search_object" },
  animal: { stopsLabelKey: "pe_animals", emptyKey: "pe_no_animals_selected", searchKey: "pe_search_object" },
  place: { stopsLabelKey: "pe_sites", emptyKey: "pe_no_sites_selected", searchKey: "pe_search_object" },
};

// V22 : le mode (Intérieur / Extérieur / Jeu de cartes) est désormais une
// propriété du PARCOURS lui-même, et non plus du type de lieu — un même
// type de lieu peut servir aussi bien à un parcours d'intérieur qu'à un
// parcours "jeu de cartes" imprimé.
const MODES = [
  { value: "indoor", labelKey: "cat_indoor", icon: "🏠" },
  { value: "outdoor", labelKey: "cat_outdoor", icon: "🌳" },
  { value: "card_game", labelKey: "pe_mode_card_game", icon: "🃏" },
];

export default function ParcoursEditor({ open, onClose, objects = [], animals = [], places = [], parcours, parentInfo, adminMode, tutorLanguage }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [parcoursTypes, setParcoursTypes] = useState([]);

  // V26 — Devinettes : bloc indépendant des éléments de chasse. Les
  // devinettes sont choisies une fois pour toutes à la création du
  // parcours (jamais recalculées selon le niveau choisi par le joueur en
  // cours de partie, contrairement à l'ancien système).
  const [riddles, setRiddles] = useState([]);
  const [riddleTypes, setRiddleTypes] = useState([]);
  const [riddleSearch, setRiddleSearch] = useState("");
  const [riddleTypeFilter, setRiddleTypeFilter] = useState("");
  const [riddleLangFilter, setRiddleLangFilter] = useState(tutorLanguage ? tutorLanguage.toUpperCase() : "");
  const [riddleAutoCount, setRiddleAutoCount] = useState(3);

  // V27 — un parcours créé par le Maître du Jeu (admin) peut être associé à
  // un tuteur précis, pour que celui-ci le retrouve et le valide dans son
  // propre espace (sinon il n'apparaissait auparavant que dans la liste
  // globale de l'admin, sans jamais rejoindre l'espace d'un tuteur).
  const [tutors, setTutors] = useState([]);
  // Portée de licence : l'admin (Maître du Jeu) utilise sa licence active
  // sur cet appareil ; un tuteur (via son Espace Parent) n'a pas de licence
  // active localement — on utilise celle héritée de son propre
  // enregistrement Parent (`parentInfo`), pour rester dans la même
  // organisation que l'admin qui l'a créé.
  const licenseCode = adminMode ? getAdminActiveLicenseCode() : (parentInfo?.license_code || "");
  async function loadTutors() {
    setTutors(await Parents.filter({ is_active: true, license_code: getAdminActiveLicenseCode() }));
  }

  async function loadTypes() {
    setParcoursTypes(await ParcoursTypes.filter({ license_code: licenseCode }, "label"));
  }
  async function loadRiddleData() {
    setRiddles(await Riddles.filter({ license_code: licenseCode }));
    setRiddleTypes(await RiddleTypes.filter({ license_code: licenseCode }, "label"));
  }
  useEffect(() => {
    loadTypes();
    loadRiddleData();
    if (adminMode) loadTutors();
    return subscribe((name) => {
      if (name === "parcours_types") loadTypes();
      if (name === "riddles" || name === "riddle_types") loadRiddleData();
      if (name === "parents" && adminMode) loadTutors();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminMode]);

  useEffect(() => {
    if (open) {
      // Repli pour un parcours créé AVANT l'introduction de l'ordonnancement
      // combiné : reconstitue une séquence par défaut (toutes les devinettes
      // d'abord, puis tous les objets/lieux/animaux) à partir des anciennes
      // listes séparées — l'admin peut ensuite la réordonner librement.
      const legacySequence = parcours && !(parcours.sequence?.length > 0)
        ? [
            ...(parcours.riddle_ids || []).map((id) => ({ type: "riddle", id })),
            ...(parcours.object_ids || []).map((id) => ({ type: "stop", id })),
          ]
        : null;
      setForm(
        parcours
          ? { ...EMPTY, ...parcours, sequence: parcours.sequence?.length > 0 ? parcours.sequence : legacySequence }
          : { ...EMPTY, parcours_type: parcoursTypes[0]?.slug || "", access_code: generateAccessCode(), ...parentInfo }
      );
      setRiddleLangFilter(tutorLanguage ? tutorLanguage.toUpperCase() : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parcours, parcoursTypes.length]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const selectedTypeInfo = useMemo(
    () => parcoursTypes.find((pt) => pt.slug === form.parcours_type),
    [parcoursTypes, form.parcours_type]
  );
  // Si le type de parcours choisi est lié à une famille précise (objets,
  // animaux ou lieux), seule cette famille est PROPOSÉE À L'AJOUT — mais ce
  // filtre ne s'applique jamais aux arrêts déjà présents dans le parcours :
  // un parcours existant qui mélange objets/animaux/lieux garde tout son
  // contenu intact, même si son type ne correspond plus qu'à une seule
  // famille. C'est ce qui a été cassé puis réparé : avant, changer de type
  // effaçait silencieusement les arrêts qui ne correspondaient plus.
  const activeKind = selectedTypeInfo?.kind || null;

  // IMPORTANT : le "Type de parcours" ne restreint QUE les nouveaux ajouts
  // (voir availableStops plus bas) — jamais les arrêts déjà sélectionnés.
  // Un parcours peut donc toujours mélanger objets, animaux et lieux si son
  // type le permet (type sans kind précis, ou ajouts effectués à des
  // moments différents avec des types différents).

  // Every discoverable entity (object, animal, place) shares the same
  // real_name / fantasy_name-or-magic_name / emoji shape and can be mixed
  // freely within a single trail. Quand un TUTEUR (pas l'admin) crée le
  // parcours, le pool reste restreint aux éléments écrits dans SA langue de
  // travail — un tuteur anglais ne voit que le contenu marqué "anglais".
  const pool = useMemo(() => {
    const matchesTutorLang = (itemLang) =>
      !tutorLanguage || (itemLang && itemLang.toLowerCase() === tutorLanguage.toLowerCase());
    const objs = objects
      .filter((o) => matchesTutorLang(o.language))
      .map((o) => ({ id: o.id, kind: "object", label: o.fantasy_name, emoji: o.emoji, search: `${o.fantasy_name} ${o.real_name}` }));
    const ans = animals
      .filter((a) => matchesTutorLang(a.language))
      .map((a) => ({ id: a.id, kind: "animal", label: a.fantasy_name, emoji: a.emoji, search: `${a.fantasy_name} ${a.real_name}` }));
    const plc = places
      .filter((p) => matchesTutorLang(p.language))
      .map((p) => ({ id: p.id, kind: "place", label: p.magic_name || p.real_name, emoji: p.emoji || "🏛️", search: `${p.magic_name || ""} ${p.real_name}` }));
    return [...objs, ...ans, ...plc];
  }, [objects, animals, places, tutorLanguage]);

  // Les arrêts déjà choisis sont TOUJOURS résolus depuis le pool complet
  // (aucun filtre par type) : rien ne disparaît jamais silencieusement.
  // Résolus depuis la séquence combinée (ordre de jeu réel), pas depuis
  // object_ids seul — voir la note sur l'ordonnancement plus haut.
  const stopIds = useMemo(() => form.sequence.filter((e) => e.type === "stop").map((e) => e.id), [form.sequence]);
  const riddleIds = useMemo(() => form.sequence.filter((e) => e.type === "riddle").map((e) => e.id), [form.sequence]);

  const selectedStops = useMemo(
    () => stopIds.map((id) => pool.find((p) => p.id === id)).filter(Boolean),
    [stopIds, pool]
  );

  // Seule la liste des NOUVEAUX éléments proposés à l'ajout est filtrée par
  // le type de parcours choisi (si ce type est lié à une famille précise).
  const availableStops = useMemo(
    () =>
      pool.filter(
        (p) =>
          !stopIds.includes(p.id) &&
          (!activeKind || p.kind === activeKind) &&
          (!search || p.search.toLowerCase().includes(search.toLowerCase()))
      ),
    [pool, stopIds, search, activeKind]
  );

  // A selected place that other places point to (parent_place_id) can be
  // "decomposed": insert all of its sub-places into the trail in one click.
  function childrenOf(stopId) {
    return places.filter((p) => p.parent_place_id === stopId);
  }

  function addStop(id) {
    set("sequence", [...form.sequence, { type: "stop", id }]);
  }
  function removeStop(id) {
    set("sequence", form.sequence.filter((e) => !(e.type === "stop" && e.id === id)));
  }
  function decompose(stopId) {
    const kids = childrenOf(stopId).map((k) => k.id).filter((id) => !stopIds.includes(id));
    if (kids.length === 0) return;
    const idx = form.sequence.findIndex((e) => e.type === "stop" && e.id === stopId);
    const items = [...form.sequence];
    items.splice(idx + 1, 0, ...kids.map((id) => ({ type: "stop", id })));
    set("sequence", items);
    toast(t("pe_decompose_done"));
  }

  // Liste combinée et ordonnable : mêle librement arrêts (objets/animaux/
  // lieux) et devinettes, dans l'ordre exact où ils seront joués — voir
  // Play.jsx qui suit cette même séquence. Faire glisser une devinette
  // au-dessus ou en dessous d'un arrêt les entrelace directement (ex : 1
  // devinette → 2 lieux → 3 devinettes).
  const orderedSequence = useMemo(
    () =>
      form.sequence
        .map((entry) =>
          entry.type === "riddle"
            ? { ...entry, data: riddles.find((r) => r.id === entry.id) }
            : { ...entry, data: pool.find((p) => p.id === entry.id) }
        )
        .filter((e) => e.data),
    [form.sequence, riddles, pool]
  );

  function onDragEnd(result) {
    if (!result.destination) return;
    const items = Array.from(form.sequence);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    set("sequence", items);
  }

  // Comptage par famille pour le résumé de composition (§11 du cahier des
  // charges : "5 objets / 0 animaux / 2 lieux / 3 devinettes").
  const stopCounts = useMemo(() => {
    const counts = { object: 0, animal: 0, place: 0 };
    selectedStops.forEach((s) => { counts[s.kind] = (counts[s.kind] || 0) + 1; });
    return counts;
  }, [selectedStops]);

  // ---- Devinettes du parcours -----------------------------------------
  // Les devinettes déjà choisies sont TOUJOURS résolues depuis la liste
  // complète (même logique que selectedStops) : rien ne disparaît si un
  // filtre change après coup.
  const selectedRiddles = useMemo(
    () => riddleIds.map((id) => riddles.find((r) => r.id === id)).filter(Boolean),
    [riddleIds, riddles]
  );

  const availableRiddles = useMemo(
    () =>
      riddles.filter(
        (r) =>
          r.is_active &&
          !riddleIds.includes(r.id) &&
          r.age_group === form.age_group &&
          (!riddleTypeFilter || r.riddle_type === riddleTypeFilter) &&
          (!riddleLangFilter || (r.language || "").toUpperCase() === riddleLangFilter.toUpperCase()) &&
          (!riddleSearch || r.question.toLowerCase().includes(riddleSearch.toLowerCase()))
      ),
    [riddles, riddleIds, form.age_group, riddleTypeFilter, riddleLangFilter, riddleSearch]
  );

  function addRiddle(id) {
    set("sequence", [...form.sequence, { type: "riddle", id }]);
  }
  function removeRiddle(id) {
    set("sequence", form.sequence.filter((e) => !(e.type === "riddle" && e.id === id)));
  }
  function autoSelectRiddles() {
    const count = Math.max(0, Number(riddleAutoCount) || 0);
    if (count === 0) return;
    const shuffled = [...availableRiddles].sort(() => Math.random() - 0.5).slice(0, count);
    if (shuffled.length === 0) {
      toast(t("pe_riddles_none_match"), "error");
      return;
    }
    set("sequence", [...form.sequence, ...shuffled.map((r) => ({ type: "riddle", id: r.id }))]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // object_ids / riddle_ids restent dérivés de `sequence` (l'ordre de
      // jeu réel) pour la rétrocompatibilité avec les écrans qui ne lisent
      // que ces deux listes (compteurs dans ParcoursManager/PrintView,
      // impression papier...) — voir la note en tête de fichier.
      const payload = {
        ...form,
        object_ids: stopIds,
        riddle_ids: riddleIds,
        license_code: licenseCode,
      };
      if (adminMode && !parcours) {
        payload.created_by_admin = true;
        // Un parcours du Maître du Jeu non associé à un tuteur précis n'a
        // personne pour l'approuver : il est donc directement actif. S'il
        // est associé à un tuteur, celui-ci doit le valider dans son propre
        // espace avant de pouvoir le jouer.
        payload.approved_by_parent = !form.parent_code;
      }
      if (parcours) {
        await Parcours.update(parcours.id, payload);
      } else {
        await Parcours.create(payload);
      }
      toast(t("common_saved"));
      onClose(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={() => onClose(false)} title={parcours ? t("pe_title_edit") : t("pe_title_new")} maxWidth="max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <Label>{t("pe_name")}</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={t("pe_name_placeholder")} />
        </div>
        <div>
          <Label>{t("pe_magic_name")}</Label>
          <Input value={form.magic_name} onChange={(e) => set("magic_name", e.target.value)} placeholder={t("pe_name_placeholder")} />
        </div>
        <div className="sm:col-span-2">
          <Label>{t("pe_description")}</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label>{t("pe_access_code")}</Label>
            <Input value={form.access_code} readOnly className="font-rune tracking-widest text-center uppercase" />
          </div>
          <Button variant="ghost" type="button" onClick={() => set("access_code", generateAccessCode())}>
            <Dice5 size={18} />
          </Button>
        </div>
        <div>
          <Label>{t("pe_type")}</Label>
          <Select value={form.parcours_type} onChange={(e) => set("parcours_type", e.target.value)}>
            {parcoursTypes.length === 0 && <option value="">—</option>}
            {parcoursTypes.map((pt) => (
              <option key={pt.slug} value={pt.slug}>{pt.emoji} {taxonomyLabel(pt, t)}</option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>{t("pe_world")}</Label>
          <p className="text-xs text-muted mb-2">{t("pe_world_hint")}</p>
          <WorldPicker value={form.world} onChange={(slug) => set("world", slug)} />
        </div>
        <div>
          <Label>{t("pe_age_group")}</Label>
          <Select value={form.age_group} onChange={(e) => set("age_group", e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.emoji} {t(l.labelKey)} · {t(l.ageRangeKey)}</option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>{t("pe_mode")}</Label>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => {
              const active = form.mode === m.value;
              return (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => set("mode", m.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs transition-colors ${
                    active ? "bg-gold/15 border-gold-dim text-gold-bright" : "bg-void/40 border-void-border text-muted hover:border-white/25"
                  }`}
                >
                  <span className="text-lg">{m.icon}</span>
                  {t(m.labelKey)}
                </button>
              );
            })}
          </div>
          {form.mode === "card_game" && <p className="text-xs text-arcane mt-1.5">{t("pe_mode_card_game_hint")}</p>}
        </div>

        {adminMode && (
          <div className="sm:col-span-2">
            <Label>{t("pe_tutor")}</Label>
            <Select value={form.parent_code} onChange={(e) => set("parent_code", e.target.value)}>
              <option value="">{t("pe_tutor_none")}</option>
              {tutors.map((p) => (
                <option key={p.id} value={p.parent_code}>
                  {p.first_name} {p.last_name} · {p.parent_code}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted mt-1">{t("pe_tutor_hint")}</p>
          </div>
        )}
      </div>

      {/* Résumé de composition — §11 du cahier des charges */}
      <div className="mb-6 flex flex-wrap gap-2 p-3 bg-void/30 border border-void-border rounded-xl">
        <Badge color="ember">🧩 {stopCounts.object || 0} {t("pe_summary_objects")}</Badge>
        <Badge color="gold">🐾 {stopCounts.animal || 0} {t("pe_summary_animals")}</Badge>
        <Badge color="arcane">📍 {stopCounts.place || 0} {t("pe_summary_places")}</Badge>
        <Badge color="emerald">❓ {selectedRiddles.length} {t("pe_summary_riddles")}</Badge>
      </div>

      <div className="mb-6">
        <Label className="flex items-center gap-1.5"><Shuffle size={14} className="text-gold-bright" /> {t("pe_sequence_title")}</Label>
        <p className="text-xs text-muted mb-2">{t("pe_sequence_hint")}</p>
        {tutorLanguage && (
          <p className="text-xs text-arcane mb-2 flex items-center gap-1">
            {LANGUAGES.find((l) => l.code.toLowerCase() === tutorLanguage.toLowerCase())?.flag}
            {t("pe_language_filter_hint").replace("{lang}", LANGUAGES.find((l) => l.code.toLowerCase() === tutorLanguage.toLowerCase())?.label || tutorLanguage)}
          </p>
        )}
        {orderedSequence.length === 0 ? (
          <p className="text-muted text-sm py-4 text-center border border-dashed border-void-border rounded-xl">
            {t("pe_sequence_empty")}
          </p>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sequence">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-2 mb-3">
                  {orderedSequence.map((entry, i) => {
                    if (entry.type === "riddle") {
                      const r = entry.data;
                      const level = LEVELS.find((l) => l.value === r.age_group);
                      const typeInfo = riddleTypes.find((rt) => rt.slug === r.riddle_type);
                      return (
                        <Draggable key={`riddle-${r.id}`} draggableId={`riddle-${r.id}`} index={i}>
                          {(dragProvided) => (
                            <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className="flex items-center gap-2 bg-void/50 border border-emerald-bright/20 rounded-xl px-3 py-2">
                              <span {...dragProvided.dragHandleProps} className="text-muted cursor-grab">
                                <GripVertical size={16} />
                              </span>
                              <HelpCircle size={14} className="text-emerald-bright shrink-0" />
                              <span className="flex-1 text-sm text-parchment truncate">{r.question}</span>
                              {r.image_url && <Badge color="gold">📷</Badge>}
                              {typeInfo && <Badge color="arcane">{typeInfo.emoji} {taxonomyLabel(typeInfo, t)}</Badge>}
                              {level && <Badge color={level.color}>{level.emoji}</Badge>}
                              <Badge color="muted">❓ {i + 1}</Badge>
                              <button onClick={() => removeRiddle(r.id)} className="text-muted hover:text-ember-bright shrink-0">
                                <X size={15} />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      );
                    }
                    const o = entry.data;
                    const kids = o.kind === "place" ? childrenOf(o.id).filter((k) => !stopIds.includes(k.id)) : [];
                    return (
                      <Draggable key={`stop-${o.id}`} draggableId={`stop-${o.id}`} index={i}>
                        {(dragProvided) => (
                          <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className="flex flex-col gap-1.5 bg-void/50 border border-void-border rounded-xl px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span {...dragProvided.dragHandleProps} className="text-muted cursor-grab">
                                <GripVertical size={16} />
                              </span>
                              <span className="text-lg">{o.emoji}</span>
                              <span className="flex-1 text-sm text-parchment">{o.label}</span>
                              <Badge color="muted">{KIND_ICON[o.kind]} {i + 1}</Badge>
                              <button onClick={() => removeStop(o.id)} className="text-muted hover:text-ember-bright">
                                <X size={15} />
                              </button>
                            </div>
                            {kids.length > 0 && (
                              <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => decompose(o.id)}>
                                <Layers size={13} /> {t("pe_decompose")} ({kids.length})
                              </Button>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      <div className="mb-6">
        <Label>{activeKind ? t(KIND_LABELS[activeKind].stopsLabelKey) : t("pe_objects")}</Label>
        <p className="text-xs text-muted mb-2">{t("pe_add_stop_hint")}</p>

        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input className="pl-8 rtl:pl-4 rtl:pr-8" placeholder={t("pe_search_object")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {availableStops.length === 0 && pool.length === 0 && tutorLanguage ? (
            <p className="text-xs text-muted italic py-2">{t("pe_no_content_in_language")}</p>
          ) : (
            availableStops.map((o) => (
              <button
                key={o.id}
                onClick={() => addStop(o.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-void-border hover:border-arcane text-sm text-parchment"
                title={o.kind}
              >
                <span>{o.emoji}</span>
                {o.label}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Devinettes du parcours — §7 du cahier des charges : bloc totalement
          indépendant des éléments de chasse, filtré par tranche d'âge (celle
          du parcours ci-dessus) + type + langue. */}
      <div className="mb-6">
        <Label className="flex items-center gap-1.5"><HelpCircle size={14} className="text-emerald-bright" /> {t("pe_riddles_title")}</Label>
        <p className="text-xs text-muted mb-2">{t("pe_riddles_hint")}</p>

        <div className="grid sm:grid-cols-3 gap-2 mb-2">
          <Select value={riddleTypeFilter} onChange={(e) => setRiddleTypeFilter(e.target.value)}>
            <option value="">{t("pe_riddles_type_all")}</option>
            {riddleTypes.map((rt) => (
              <option key={rt.slug} value={rt.slug}>{rt.emoji} {taxonomyLabel(rt, t)}</option>
            ))}
          </Select>
          <Select value={riddleLangFilter} onChange={(e) => setRiddleLangFilter(e.target.value)} disabled={!!tutorLanguage}>
            <option value="">{t("pe_riddles_lang_all")}</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code.toUpperCase()}>{l.flag} {l.label}</option>
            ))}
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={riddleAutoCount}
              onChange={(e) => setRiddleAutoCount(e.target.value)}
              className="w-16"
            />
            <Button type="button" variant="arcane" size="sm" onClick={autoSelectRiddles} className="flex-1">
              <Shuffle size={13} /> {t("pe_riddles_auto")}
            </Button>
          </div>
        </div>

        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input className="pl-8 rtl:pl-4 rtl:pr-8" placeholder={t("pe_riddles_search")} value={riddleSearch} onChange={(e) => setRiddleSearch(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
          {availableRiddles.length === 0 ? (
            <p className="text-xs text-muted italic py-2 text-center">{t("pe_riddles_none_match")}</p>
          ) : (
            availableRiddles.map((r) => (
              <button
                key={r.id}
                onClick={() => addRiddle(r.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-void-border hover:border-emerald text-sm text-parchment text-left"
              >
                <HelpCircle size={13} className="shrink-0 text-muted" />
                <span className="flex-1 truncate">{r.question}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mb-6">
        <Label>{t("pe_timing")}</Label>
        <div className="grid sm:grid-cols-2 gap-3">
          <NumberField label={t("pe_time_limit")} value={form.time_limit_minutes} onChange={(v) => set("time_limit_minutes", v)} />
          <NumberField label={t("pe_penalty_hint")} value={form.penalty_per_hint_seconds} onChange={(v) => set("penalty_per_hint_seconds", v)} />
          <NumberField label={t("pe_penalty_wrong")} value={form.penalty_per_wrong_code_seconds} onChange={(v) => set("penalty_per_wrong_code_seconds", v)} />
          <NumberField label={t("pe_penalty_riddle")} value={form.penalty_per_wrong_riddle_seconds} onChange={(v) => set("penalty_per_wrong_riddle_seconds", v)} />
          <NumberField label={t("pe_riddle_time_limit")} value={form.riddle_time_limit_seconds} onChange={(v) => set("riddle_time_limit_seconds", v)} />
          <NumberField label={t("pe_suspension")} value={form.suspension_after_errors} onChange={(v) => set("suspension_after_errors", v)} />
          <NumberField label={t("pe_suspension_duration")} value={form.suspension_duration_seconds} onChange={(v) => set("suspension_duration_seconds", v)} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Label className="mb-0">{t("pe_active")}</Label>
        <Switch checked={form.is_active} onChange={(v) => set("is_active", v)} />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => onClose(false)}>{t("common_cancel")}</Button>
        <Button onClick={handleSave} disabled={!form.name || (stopIds.length === 0 && riddleIds.length === 0) || saving}>
          {t("common_save")}
        </Button>
      </div>
    </Modal>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
