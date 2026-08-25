import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Printer, CheckCircle2, Copy, ShieldAlert } from "lucide-react";
import { Parcours, ParcoursTypes, GameObjects, Animals, Places, Riddles, Parents, subscribe, getAdminActiveLicenseCode } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import { getActiveLicense } from "@/lib/auth";
import { taxonomyLabel } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Badge, EmptyState, useConfirm, useToast } from "@/components/ui/Misc";
import ParcoursEditor from "@/components/parent/ParcoursEditor";
import PrintView from "@/components/parent/PrintView";
import { LEVELS } from "@/lib/gameData";

export default function ParcoursManager({
  scopeParentCode,
  adminMode = false,
  parentInfo,
  maxPlayers,
  isPlayerLimitReached
}) {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const activeLicense = getActiveLicense();

  // Détermination des limites V22
  const limitPlayers = maxPlayers ?? activeLicense?.maxPlayers ?? 10;
  const limitReached = isPlayerLimitReached ?? false;

  const [list, setList] = useState([]);
  const [objects, setObjects] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [places, setPlaces] = useState([]);
  const [riddles, setRiddles] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [parcoursTypes, setParcoursTypes] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [printing, setPrinting] = useState(null);

  async function load() {
    // adminMode : le Maître du Jeu ne voit que les parcours/données de sa
    // propre licence. Sinon (tuteur via l'Espace Parent) : la recherche par
    // parent_code cible déjà spécifiquement ses propres parcours, et les
    // données de référence (objets/animaux/lieux/devinettes/types) utilisent
    // la licence héritée de son enregistrement Parent (`parentInfo`).
    const licenseCode = adminMode ? getAdminActiveLicenseCode() : (parentInfo?.license_code || "");
    const all = adminMode
      ? await Parcours.filter({ license_code: licenseCode }, "-created_date")
      : await Parcours.filter({ parent_code: scopeParentCode });
    setList(adminMode ? all : all.sort((a, b) => (a.created_date < b.created_date ? 1 : -1)));
    setObjects(await GameObjects.filter({ license_code: licenseCode }));
    setAnimals(await Animals.filter({ license_code: licenseCode }));
    setPlaces(await Places.filter({ license_code: licenseCode }));
    setRiddles(await Riddles.filter({ license_code: licenseCode }));
    setParcoursTypes(await ParcoursTypes.filter({ license_code: licenseCode }));
    if (adminMode) setTutors(await Parents.filter({ license_code: licenseCode }));
  }

  useEffect(() => {
    load();
    return subscribe((name) => ["parcours", "parcours_types", "game_objects", "animals", "places", "riddles", "parents"].includes(name) && load());
  }, [scopeParentCode, adminMode]);

  async function handleDelete(p) {
    const ok = await confirm({ title: t("confirm_delete_title"), message: t("confirm_delete_msg") });
    if (!ok) return;
    await Parcours.remove(p.id);
    toast(t("common_deleted"));
  }

  async function handleApprove(p) {
    await Parcours.update(p.id, { approved_by_parent: true });
    toast(t("common_saved"));
  }

  function copyCode(code) {
    navigator.clipboard?.writeText(code);
    toast(t("common_copied"));
  }

  function handleCreateNew() {
    if (limitReached && !adminMode) {
      toast(`Limite atteinte : maximum ${limitPlayers} joueur(s) autorisé(s) par votre licence.`, "error");
      return;
    }
    setEditing(null);
    setEditorOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl text-parchment">{adminMode ? t("admin_tab_parcours") : t("parent_tab_parcours")}</h2>
        <Button
          size="sm"
          onClick={handleCreateNew}
          disabled={limitReached && !adminMode}
          title={limitReached ? `Limite de licence atteinte (${limitPlayers} max)` : ""}
        >
          <Plus size={16} /> {t("parent_new_parcours")}
        </Button>
      </div>

      {limitReached && !adminMode && (
        <div className="mb-4 p-3 bg-ember/15 border border-ember/30 rounded-xl flex items-center gap-2 text-xs text-ember-bright">
          <ShieldAlert size={16} className="shrink-0" />
          <span>Quota de licence atteint ({limitPlayers} joueur(s) max). La création de nouveaux parcours est désactivée.</span>
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState icon="🗺️" title={t("parent_empty_parcours")} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((p, i) => {
            const level = LEVELS.find((l) => l.value === p.age_group);
            const type = parcoursTypes.find((pt) => pt.slug === p.parcours_type);
            const needsApproval = p.created_by_admin && !p.approved_by_parent && !adminMode;
            return (
              <div key={p.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-pop-in bg-void-panel/60 border border-void-border rounded-2xl p-5 flex flex-col gap-3 hover:border-gold-dim/40 hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-parchment">{p.magic_name || p.name}</h3>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2">{p.description}</p>
                  </div>
                  <Badge color={p.is_active ? "emerald" : "muted"}>
                    {p.is_active ? t("common_active") : t("common_inactive")}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge color={level?.color}>{level?.emoji} {level ? t(level.labelKey) : p.age_group}</Badge>
                  {type && <Badge color="arcane">{type.emoji} {taxonomyLabel(type, t)}</Badge>}
                  <Badge color="arcane">{p.object_ids?.length || 0} {t("parent_objects_count")}</Badge>
                  {p.riddle_ids?.length > 0 && <Badge color="emerald">❓ {p.riddle_ids.length}</Badge>}
                  {adminMode && p.parent_code && (() => {
                    const tutor = tutors.find((tu) => tu.parent_code === p.parent_code);
                    return (
                      <Badge color="gold">
                        🧙 {tutor ? `${tutor.first_name} ${tutor.last_name}` : p.parent_code}
                      </Badge>
                    );
                  })()}
                </div>

                <button
                  onClick={() => copyCode(p.access_code)}
                  className="flex items-center justify-between gap-2 bg-void/50 border border-void-border rounded-xl px-3 py-2 text-left hover:border-gold-dim"
                >
                  <span className="text-xs text-muted">{t("parent_access_code")}</span>
                  <span className="font-rune text-gold-bright tracking-widest flex items-center gap-2">
                    {p.access_code} <Copy size={13} />
                  </span>
                </button>

                {needsApproval && (
                  <div className="bg-arcane/10 border border-arcane-dim/40 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-arcane">{t("parent_pending_admin")}</span>
                    <Button size="sm" variant="arcane" onClick={() => handleApprove(p)}>
                      <CheckCircle2 size={14} /> {t("parent_approve")}
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant="ghost" className="flex-1" onClick={() => setPrinting(p)}>
                    <Printer size={14} /> {t("parent_print")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setEditorOpen(true); }}>
                    <Pencil size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(p)}>
                    <Trash2 size={14} className="text-ember" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ParcoursEditor
        open={editorOpen}
        onClose={(changed) => { setEditorOpen(false); if (changed) load(); }}
        parcours={editing}
        objects={objects}
        animals={animals}
        places={places}
        parentInfo={parentInfo}
        adminMode={adminMode}
        tutorLanguage={!adminMode ? parentInfo?.parent_language : null}
      />

      {printing && (
        <PrintView parcours={printing} objects={objects} animals={animals} places={places} riddles={riddles} onClose={() => setPrinting(null)} />
      )}
    </div>
  );
}