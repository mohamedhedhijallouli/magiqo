import React, { useState } from "react";
import { motion } from "framer-motion";
import { Ticket, ArrowRight, Loader2, ScanLine } from "lucide-react";
import { PlayerTickets } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import QrScannerModal from "@/components/shared/QrScannerModal";

// Étape "ticket joueur" (V19) : une fois le parcours identifié (voir
// Play.jsx), et seulement si la licence de son Maître du Jeu n'est pas
// forfaitaire, le joueur scanne (ou tape) le code unique de son ticket,
// remis à l'avance par le Maître du Jeu (voir TicketsPanel). Un ticket ne
// peut servir qu'une seule fois, ce qui fait naturellement respecter le
// quota de joueurs de la licence.
export default function TicketEntry({ onValidated, licenseCode }) {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  async function submit(raw) {
    const candidate = (raw !== undefined ? raw : code).trim().toUpperCase();
    if (!candidate) return;
    setError("");
    setLoading(true);
    // Scopé à la licence du parcours déjà identifié (voir Play.jsx) : un
    // ticket généré par une autre organisation ne doit pas être accepté ici.
    const tickets = await PlayerTickets.filter({ code: candidate, license_code: licenseCode });
    await new Promise((r) => setTimeout(r, 300));
    setLoading(false);
    const ticket = tickets[0];
    if (!ticket) {
      setError(t("tix_error_not_found"));
      return;
    }
    if (ticket.used) {
      setError(t("tix_error_used"));
      return;
    }
    await PlayerTickets.update(ticket.id, { used: true, used_at: new Date().toISOString() });
    onValidated(ticket);
  }

  function handleScanned(text) {
    setScannerOpen(false);
    const clean = text.trim().toUpperCase();
    setCode(clean);
    submit(clean);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardContent>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center border border-gold-dim/40">
              <Ticket className="text-gold" size={20} />
            </div>
            <h2 className="font-display text-xl text-parchment">{t("tix_entry_title")}</h2>
          </div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Label>{t("tix_entry_label")}</Label>
            <Input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={t("tix_entry_placeholder")}
              className="text-center font-rune text-xl tracking-[0.2em] uppercase py-4"
            />
            {error && <p className="text-ember-bright text-sm mt-2">{error}</p>}

            <Button className="w-full mt-5" disabled={!code || loading} onClick={() => submit()}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
              {loading ? t("pce_verify") : t("pce_continue")}
            </Button>
            <Button variant="ghost" className="w-full mt-2" onClick={() => setScannerOpen(true)}>
              <ScanLine size={16} /> {t("qr_scan_button")}
            </Button>
          </motion.div>
        </CardContent>
      </Card>

      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetect={handleScanned} />
    </div>
  );
}
