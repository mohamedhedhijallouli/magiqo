import React from "react";
import { Clock, AlertOctagon, Ban } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { formatTime } from "@/lib/gameData";
import { cn } from "@/lib/utils";

export default function Timer({ elapsed, penaltyCount, suspended, suspendedRemaining }) {
  const { t } = useLanguage();
  return (
    <div className="w-full max-w-lg mx-auto mb-5">
      <div className="flex items-center justify-between gap-3 bg-void-panel/70 border border-void-border rounded-2xl px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2 font-rune text-lg text-parchment">
          <Clock size={18} className="text-arcane" />
          {formatTime(elapsed)}
        </div>
        {penaltyCount > 0 && (
          <div className="flex items-center gap-1.5 text-ember-bright text-sm font-semibold">
            <AlertOctagon size={16} />
            {penaltyCount} · {t("timer_penalties")}
          </div>
        )}
      </div>
      {suspended && (
        <div className="mt-2 flex items-center gap-2 justify-center text-sm font-bold text-ember-bright bg-ember/10 border border-ember/30 rounded-xl px-4 py-2 animate-pulse">
          <Ban size={16} />
          {t("timer_suspended_msg")} ({suspendedRemaining}s)
        </div>
      )}
    </div>
  );
}
