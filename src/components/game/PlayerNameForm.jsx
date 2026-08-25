import React, { useState } from "react";
import { motion } from "framer-motion";
import { Wand2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { LEVELS } from "@/lib/gameData";

export default function PlayerNameForm({ parcours, onSubmit }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [level, setLevel] = useState(parcours.age_group || "apprenti");

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardContent>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center border border-gold-dim/40">
              <Wand2 className="text-gold" size={20} />
            </div>
            <h2 className="font-display text-xl text-parchment">{t("pnf_title")}</h2>
          </div>
          <p className="text-muted text-sm mb-6">
            {parcours.object_ids?.length || 0} {t("pnf_steps")}
            {parcours.riddle_ids?.length > 0 && <> · {parcours.riddle_ids.length} {t("pnf_riddles")}</>}
          </p>

          <Label>{t("pnf_firstname")}</Label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("pnf_firstname_placeholder")}
            className="mb-5"
            maxLength={20}
          />

          <Label>{t("pnf_agegroup")}</Label>
          <div className="grid grid-cols-1 gap-2 mb-6">
            {LEVELS.map((l) => (
              <motion.button
                key={l.value}
                onClick={() => setLevel(l.value)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                animate={level === l.value ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left",
                  level === l.value
                    ? "border-gold-dim bg-gold/10"
                    : "border-void-border bg-void/40 hover:border-white/20"
                )}
              >
                <span className={cn("text-2xl", level === l.value && "animate-wiggle")}>{l.emoji}</span>
                <span>
                  <span className="block font-semibold text-parchment">
                    {t(l.labelKey)} <span className="text-muted font-normal">· {t(l.ageRangeKey)}</span>
                  </span>
                  <span className="block text-xs text-muted">{t(l.experienceKey)}</span>
                </span>
              </motion.button>
            ))}
          </div>

          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              className="w-full"
              disabled={!name.trim()}
              onClick={() => onSubmit({ name: name.trim(), level })}
            >
              🗡️ {t("pnf_launch")}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
