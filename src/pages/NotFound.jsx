import React from "react";
import { Link } from "react-router-dom";
import StarsBackground from "@/components/game/StarsBackground";
import MagiQoLogo from "@/components/game/MagiQoLogo";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center gap-5 text-center px-6 overflow-hidden">
      <StarsBackground density={50} />
      <div className="relative z-10 flex flex-col items-center gap-5">
        <MagiQoLogo size={90} />
        <h1 className="font-display text-3xl text-gold-bright">404</h1>
        <p className="text-muted max-w-sm">Cette page s'est perdue dans les brumes du royaume.</p>
        <Button as={Link} to="/">{t("common_back")}</Button>
      </div>
    </div>
  );
}
