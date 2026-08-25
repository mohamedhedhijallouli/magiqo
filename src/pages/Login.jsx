import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound } from "lucide-react";
import StarsBackground from "@/components/game/StarsBackground";
import MagiQoLogo from "@/components/game/MagiQoLogo";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Label, Switch } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";
import { login } from "@/lib/auth";
import { seedDatabase } from "@/lib/db";

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login({ email, password, rememberEmail: remember });
    setLoading(false);
    if (!result.ok) {
      setError(t(result.error === "fields" ? "auth_error_fields" : "auth_error_credentials"));
      return;
    }
    navigate(result.role === "master" ? "/masters" : "/dashboard");
    // Le code de licence vient d'être activé sur cet appareil (voir
    // setAdminActiveLicenseCode dans lib/auth.js) : on amorce les
    // taxonomies par défaut de cette licence si ce n'est pas déjà fait.
    // La donnée elle-même est déjà partagée en direct via Supabase — plus
    // besoin d'une synchronisation manuelle.
    seedDatabase();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-radial-fade flex flex-col">
      <StarsBackground density={50} />
      <div className="relative z-10 flex items-center justify-between p-5">
        <Link to="/" className="flex items-center gap-2 text-muted hover:text-parchment transition-colors">
          <ArrowLeft size={18} /> {t("auth_back")}
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <MagiQoLogo size={72} />
            <h1 className="font-display text-2xl text-gold-bright mt-3">{t("auth_login_title")}</h1>
          </div>

          <Card>
            <CardContent>
              <form onSubmit={handleSubmit} autoComplete="off">
                <Label>{t("auth_email")}</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mb-4" autoFocus autoComplete="off" />

                <Label>{t("auth_password")}</Label>
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mb-4" autoComplete="new-password" />

                <div className="flex items-center justify-between mb-5">
                  <Label className="mb-0 flex items-center gap-2">
                    <KeyRound size={13} className="text-muted" /> {t("auth_remember_email")}
                  </Label>
                  <Switch checked={remember} onChange={setRemember} />
                </div>

                {error && <p className="text-ember-bright text-sm mb-4">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {t("auth_login_btn")}
                </Button>
              </form>

              <p className="text-center text-sm text-muted mt-5">
                {t("auth_no_account")}{" "}
                <Link to="/register" className="text-arcane hover:text-gold-bright font-semibold underline underline-offset-4">
                  {t("auth_signup_link")}
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
