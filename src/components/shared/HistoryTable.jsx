import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Quests, Parents, subscribe, getAdminActiveLicenseCode } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import { Badge, EmptyState, useConfirm, useToast } from "@/components/ui/Misc";
import { formatTime, BADGE_THRESHOLDS, LEVELS } from "@/lib/gameData";

export default function HistoryTable({ scopeParentCode }) {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const [quests, setQuests] = useState([]);
  const [parentsByCode, setParentsByCode] = useState({});

  async function load() {
    const all = scopeParentCode
      ? await Quests.filter({ parent_code: scopeParentCode })
      : await Quests.filter({ license_code: getAdminActiveLicenseCode() });
    setQuests(all.sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1)));
    if (!scopeParentCode) {
      const parents = await Parents.filter({ license_code: getAdminActiveLicenseCode() });
      const map = {};
      parents.forEach((p) => (map[p.parent_code] = `${p.first_name} ${p.last_name}`.trim()));
      setParentsByCode(map);
    }
  }
  useEffect(() => {
    load();
    return subscribe((name) => (name === "quests" || name === "parents") && load());
  }, [scopeParentCode]);

  async function handleDelete(q) {
    const ok = await confirm({ title: t("confirm_delete_title"), message: t("history_delete_confirm") });
    if (!ok) return;
    await Quests.remove(q.id);
    toast(t("common_deleted"));
  }

  if (quests.length === 0) return <EmptyState icon="📜" title={t("parent_history_empty")} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-void-border">
            <th className="py-2 pr-4 font-semibold">{t("history_player")}</th>
            {!scopeParentCode && <th className="py-2 pr-4 font-semibold">{t("pm_title")}</th>}
            <th className="py-2 pr-4 font-semibold">{t("history_difficulty")}</th>
            <th className="py-2 pr-4 font-semibold">{t("history_time")}</th>
            <th className="py-2 pr-4 font-semibold">{t("history_penalties")}</th>
            <th className="py-2 pr-4 font-semibold">{t("history_score")}</th>
            <th className="py-2 pr-4 font-semibold">{t("history_badge")}</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {quests.map((q) => {
            const level = LEVELS.find((l) => l.value === q.difficulty);
            const badge = BADGE_THRESHOLDS[q.badge];
            return (
              <tr key={q.id} className="border-b border-void-border/50 hover:bg-white/[0.03]">
                <td className="py-3 pr-4 font-semibold text-parchment">{q.player_name}</td>
                {!scopeParentCode && (
                  <td className="py-3 pr-4 text-muted">{parentsByCode[q.parent_code] || q.parent_code}</td>
                )}
                <td className="py-3 pr-4"><Badge color={level?.color}>{level?.emoji} {level ? t(level.labelKey) : q.difficulty}</Badge></td>
                <td className="py-3 pr-4 font-rune">{formatTime(q.total_time_seconds)}</td>
                <td className="py-3 pr-4">{q.penalty_count}</td>
                <td className="py-3 pr-4 font-rune text-gold-bright">{q.score}</td>
                <td className="py-3 pr-4">
                  <span className="text-lg">{badge?.emoji}</span>
                </td>
                <td className="py-3 text-right">
                  <button onClick={() => handleDelete(q)} className="text-muted hover:text-ember-bright p-1.5 rounded-lg hover:bg-ember/10">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
