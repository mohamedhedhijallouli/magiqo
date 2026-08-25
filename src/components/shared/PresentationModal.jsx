import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useLanguage } from "@/lib/LanguageContext";
import { ParcoursTypes, subscribe } from "@/lib/db";
import { taxonomyLabel } from "@/lib/utils";

export default function PresentationModal({ open, onClose }) {
  const { t } = useLanguage();
  const [parcoursTypes, setParcoursTypes] = useState([]);

  async function load() {
    setParcoursTypes(await ParcoursTypes.list());
  }
  useEffect(() => {
    load();
    return subscribe((name) => name === "parcours_types" && load());
  }, []);

  return (
    <Modal open={open} onClose={onClose} title={t("presentation_title")} maxWidth="max-w-2xl">
      <p className="text-parchment/90 leading-relaxed mb-6">{t("presentation_intro")}</p>

      <h3 className="font-display text-gold-bright text-sm mb-3">{t("presentation_modes_title")}</h3>
      <div className="flex flex-wrap gap-2 mb-6">
        {parcoursTypes.map((pt) => (
          <span key={pt.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-void/40 border border-void-border text-sm text-parchment">
            {pt.emoji} {taxonomyLabel(pt, t)}
          </span>
        ))}
      </div>

      <h3 className="font-display text-gold-bright text-sm mb-3">{t("presentation_advantages_title")}</h3>
      <ul className="flex flex-col gap-2 text-sm text-parchment/85">
        {["presentation_adv_1", "presentation_adv_2", "presentation_adv_3", "presentation_adv_4"].map((k) => (
          <li key={k} className="flex items-start gap-2">
            <span className="text-emerald-bright">✓</span> {t(k)}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
