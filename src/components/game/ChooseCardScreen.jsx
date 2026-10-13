import React from "react";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CardDisplay from "@/components/game/CardDisplay";

// Affiché une seule fois, avant la première étape, quand le TYPE du
// parcours est lié à un univers de cartes (voir ParcoursTypesManager.jsx).
// Le joueur choisit un personnage parmi cet univers — toujours au niveau 0
// (Novice) pour lui s'il ne l'a encore jamais obtenu, ou à son niveau déjà
// acquis s'il le possède déjà (collection universelle).
export default function ChooseCardScreen({ cards, playerLevels, onChoose }) {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = React.useState(null);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardContent>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center border border-gold-dim/40">
              <Sparkles className="text-gold" size={20} />
            </div>
            <h2 className="font-display text-xl text-parchment">{t("ccs_title")}</h2>
          </div>
          <p className="text-muted text-sm mb-6">{t("ccs_hint")}</p>

          <div className="flex flex-wrap gap-3 justify-center mb-6 max-h-80 overflow-y-auto py-1">
            {cards.map((c) => (
              <CardDisplay
                key={c.id}
                card={c}
                level={playerLevels?.[c.id] || 0}
                selected={selectedId === c.id}
                onClick={() => setSelectedId(c.id)}
              />
            ))}
          </div>

          <Button className="w-full" disabled={!selectedId} onClick={() => onChoose(selectedId)}>
            {t("ccs_confirm")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
