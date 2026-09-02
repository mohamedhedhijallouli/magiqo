import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import StarsBackground from "@/components/game/StarsBackground";
import MagiQoLogo from "@/components/game/MagiQoLogo";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";
import { signup } from "@/lib/auth";
import { seedDatabase } from "@/lib/db";

const ERROR_KEYS = {
  fields: "auth_error_fields",
  mismatch: "auth_error_mismatch",
  exists: "auth_error_exists",
  license: "auth_error_license",
  license_email: "auth_error_license_email",
};

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", licenseCode: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signup({ ...form, rememberEmail: false });
    setLoading(false);
    if (!result.ok) {
      setError(t(ERROR_KEYS[result.error] || "auth_error_fields"));
      return;
    }
    navigate(result.role === "master" ? "/masters" : "/dashboard");
    // Voir Login.jsx : amorce les taxonomies par défaut de cette licence
    // maintenant qu'elle vient d'être activée sur cet appareil.
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
            <h1 className="font-display text-2xl text-gold-bright mt-3">{t("auth_signup_title")}</h1>
          </div>

          <Card>
            <CardContent>
              <form onSubmit={handleSubmit} autoComplete="off">
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>{t("auth_lastname")}</Label>
                    <Input required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} autoFocus autoComplete="off" />
                  </div>
                  <div>
                    <Label>{t("auth_firstname")}</Label>
                    <Input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="off" />
                  </div>
                </div>

                <Label>{t("auth_license_code")}</Label>
                <Input required value={form.licenseCode} onChange={(e) => set("licenseCode", e.target.value)} className="mb-4 font-rune tracking-widest" placeholder="" autoComplete="off" />

                <Label>{t("auth_email")}</Label>
                <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className="mb-4" autoComplete="off" />

                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <Label>{t("auth_password")}</Label>
                    <Input type="password" required value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" />
                  </div>
                  <div>
                    <Label>{t("auth_confirm_password")}</Label>
                    <Input type="password" required value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} autoComplete="new-password" />
                  </div>
                </div>

                {error && <p className="text-ember-bright text-sm mb-4">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {t("auth_signup_btn")}
                </Button>
              </form>

              <p className="text-center text-sm text-muted mt-5">
                {t("auth_have_account")}{" "}
                <Link to="/login" className="text-arcane hover:text-gold-bright font-semibold underline underline-offset-4">
                  {t("auth_login_link")}
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
