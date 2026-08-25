import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Check, X, Clock, Lightbulb } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Misc";
import { cn } from "@/lib/utils";

export default function RiddleStep({ riddles, onDone, onWrong, timeLimitSeconds = 0 }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | 'timeout'
  const [remaining, setRemaining] = useState(timeLimitSeconds);
  const [hintVisible, setHintVisible] = useState(false);

  const riddle = riddles[index];

  useEffect(() => {
    setRemaining(timeLimitSeconds);
  }, [index, timeLimitSeconds]);

  useEffect(() => {
    if (!timeLimitSeconds || feedback) return;
    if (remaining <= 0) {
      setFeedback("timeout");
      setTimeout(advance, 1600);
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, timeLimitSeconds, feedback]);

  if (!riddle) return null;

  function advance() {
    setFeedback(null);
    setValue("");
    setHintVisible(false);
    if (index + 1 < riddles.length) setIndex(index + 1);
    else onDone();
  }

  function submitAnswer(given) {
    // Une devinette peut accepter plusieurs formulations de réponse
    // ("plusieurs réponses acceptées", §4 du cahier des charges).
    const normalized = given.trim().toLowerCase();
    const acceptedAnswers = [riddle.answer, ...(riddle.alt_answers || [])].filter(Boolean).map((a) => a.trim().toLowerCase());
    const ok = acceptedAnswers.includes(normalized);
    setFeedback(ok ? "correct" : "wrong");
    if (ok) {
      setTimeout(advance, 900);
    } else {
      onWrong?.();
      setTimeout(() => setFeedback(null), 900);
    }
  }

  const isChoice = riddle.type === "choice" && riddle.choices?.length > 0;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md mx-auto">
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="text-arcane" size={20} />
              <h3 className="font-display text-lg text-parchment">{t("riddle_title")}</h3>
            </div>
            <div className="flex items-center gap-2">
              {timeLimitSeconds > 0 && !feedback && (
                <Badge color={remaining <= 5 ? "ember" : "muted"}>
                  <Clock size={11} className="mr-1 inline" /> {remaining}s
                </Badge>
              )}
              <Badge color="arcane">
                {index + 1}/{riddles.length}
              </Badge>
            </div>
          </div>

          {riddle.category && <Badge color="muted" className="mb-3">{riddle.category}</Badge>}

          <p className="text-parchment/90 leading-relaxed mb-2">{riddle.question}</p>

          {riddle.hint && (
            <div className="mb-4">
              {hintVisible ? (
                <p className="text-xs text-gold-bright/90 flex items-start gap-1.5 bg-gold/10 border border-gold-dim/30 rounded-lg px-3 py-2">
                  <Lightbulb size={13} className="shrink-0 mt-0.5" /> {riddle.hint}
                </p>
              ) : (
                <button onClick={() => setHintVisible(true)} className="text-xs text-muted hover:text-gold-bright underline underline-offset-4 flex items-center gap-1">
                  <Lightbulb size={12} /> {t("riddle_show_hint")}
                </button>
              )}
            </div>
          )}

          {isChoice ? (
            <div className="flex flex-col gap-2">
              {riddle.choices.map((c, i) => (
                <button
                  key={i}
                  disabled={!!feedback}
                  onClick={() => submitAnswer(c)}
                  className={cn(
                    "text-left px-4 py-2.5 rounded-xl border-2 transition-colors text-parchment",
                    feedback && c === riddle.answer && "border-emerald bg-emerald/10",
                    feedback === "wrong" && c !== riddle.answer && "border-void-border opacity-50",
                    !feedback && "border-void-border bg-void/40 hover:border-arcane"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && value && submitAnswer(value)}
              placeholder={t("riddle_answer_placeholder")}
              autoFocus
              disabled={!!feedback}
              className={cn(
                feedback === "correct" && "border-emerald ring-2 ring-emerald",
                feedback === "wrong" && "border-ember ring-2 ring-ember animate-pulse"
              )}
            />
          )}

          <AnimatePresence>
            {feedback && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "mt-3 text-sm font-semibold flex items-center gap-1",
                  feedback === "correct" ? "text-emerald-bright" : feedback === "timeout" ? "text-gold-bright" : "text-ember-bright"
                )}
              >
                {feedback === "correct" && <Check size={16} />}
                {feedback === "wrong" && <X size={16} />}
                {feedback === "correct" && t("riddle_correct")}
                {feedback === "wrong" && t("riddle_wrong")}
                {feedback === "timeout" && `⏱ ${riddle.answer}`}
              </motion.p>
            )}
          </AnimatePresence>

          {!isChoice && (
            <div className="flex gap-3 mt-5">
              <Button className="flex-1" disabled={!value || !!feedback} onClick={() => submitAnswer(value)}>
                {t("riddle_validate")}
              </Button>
            </div>
          )}
          <button onClick={onDone} className="text-muted text-xs mt-4 hover:text-parchment underline underline-offset-4 mx-auto block">
            {t("riddle_skip")}
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
