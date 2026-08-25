import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Ticket, Sparkles, Download, CheckCircle2, Circle, Infinity as InfinityIcon } from "lucide-react";
import { PlayerTickets, generateTicketCode, subscribe, getAdminActiveLicenseCode } from "@/lib/db";
import { getActiveLicense } from "@/lib/auth";
import { isUnlimited } from "@/lib/license";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useConfirm, useToast } from "@/components/ui/Misc";

export default function TicketsPanel() {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const toast = useToast();
  const activeLicense = getActiveLicense();
  const maxPlayers = activeLicense?.maxPlayers ?? 10;
  const isForfait = activeLicense?.licenseType === "forfaitaire" || isUnlimited(maxPlayers);

  const [tickets, setTickets] = useState([]);
  const [qrImages, setQrImages] = useState({});
  const [generating, setGenerating] = useState(false);
  const printRef = useRef(null);

  async function load() {
    setTickets(await PlayerTickets.filter({ license_code: getAdminActiveLicenseCode() }, "created_date"));
  }
  useEffect(() => {
    load();
    return subscribe((name) => name === "player_tickets" && load());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        tickets.map(async (tk) => [tk.code, await QRCode.toDataURL(tk.code, { width: 180, margin: 1, color: { dark: "#181233", light: "#F3EAD8" } })])
      );
      if (!cancelled) setQrImages(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [tickets]);

  // Génère exactement `maxPlayers` tickets (le nombre de joueurs autorisés
  // par la licence active) : si 5 joueurs → 5 tickets, si 100 joueurs → 100
  // tickets. Chaque ticket a un QR code unique scanné par le joueur avant
  // de saisir le code du parcours.
  //
  // V22 : les tickets ne sont générés qu'UNE SEULE FOIS — une fois créés,
  // ce bouton disparaît (plus de régénération possible, pour éviter
  // d'invalider silencieusement des tickets déjà distribués aux joueurs).
  async function handleGenerate() {
    if (tickets.length > 0) return;
    setGenerating(true);
    try {
      const codes = [];
      const batch = [];
      for (let i = 0; i < maxPlayers; i++) {
        const code = generateTicketCode(codes);
        codes.push(code);
        batch.push({ code, label: `${t("tix_player")} ${i + 1}`, used: false, used_by: "", license_code: getAdminActiveLicenseCode() });
      }
      await PlayerTickets.bulkCreate(batch);
      toast(t("tix_generated").replace("{n}", maxPlayers));
    } finally {
      setGenerating(false);
    }
  }

  async function downloadPdf() {
    if (!printRef.current) return;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const nodes = printRef.current.querySelectorAll(".ticket-card");
    const perPage = 8; // 2 columns x 4 rows
    for (let i = 0; i < nodes.length; i++) {
      const canvas = await html2canvas(nodes[i], { scale: 2, backgroundColor: "#181233" });
      const img = canvas.toDataURL("image/png");
      const col = i % 2;
      const row = Math.floor((i % perPage) / 2);
      if (i > 0 && i % perPage === 0) pdf.addPage();
      const w = 90, h = 60;
      const x = 10 + col * 95;
      const y = 10 + row * 65;
      pdf.addImage(img, "PNG", x, y, w, h);
    }
    pdf.save("magiqo-tickets-joueurs.pdf");
  }

  const usedCount = tickets.filter((tk) => tk.used).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Ticket size={16} /> {t("tix_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted mb-4">{t("tix_intro")}</p>

          {isForfait ? (
            <div className="flex items-center gap-3 p-4 bg-arcane/10 border border-arcane/30 rounded-xl">
              <InfinityIcon size={20} className="text-arcane shrink-0" />
              <p className="text-sm text-parchment">{t("tix_forfait_note")}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap mb-5 p-3 bg-void/40 border border-void-border rounded-xl">
                <span className="text-sm text-parchment">
                  {t("tix_license_quota")}: <strong className="text-gold-bright">{maxPlayers}</strong>
                  {tickets.length > 0 && <span className="text-muted"> · {usedCount}/{tickets.length} {t("tix_used")}</span>}
                </span>
                <div className="flex gap-2">
                  {tickets.length > 0 && (
                    <Button size="sm" variant="ghost" onClick={downloadPdf}>
                      <Download size={14} /> PDF
                    </Button>
                  )}
                  {tickets.length === 0 && (
                    <Button size="sm" onClick={handleGenerate} disabled={generating}>
                      <Sparkles size={14} /> {t("tix_generate").replace("{n}", maxPlayers)}
                    </Button>
                  )}
                </div>
              </div>
              {tickets.length > 0 && (
                <p className="text-xs text-muted mb-4">{t("tix_generated_once_note")}</p>
              )}

              {tickets.length === 0 ? (
                <p className="text-muted text-sm py-6 text-center">{t("tix_empty")}</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {tickets.map((tk) => (
                    <div key={tk.id} className="flex items-center gap-3 bg-void-panel/60 border border-void-border rounded-xl p-3">
                      {qrImages[tk.code] && <img src={qrImages[tk.code]} alt="QR" className="w-12 h-12 rounded-lg bg-parchment shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-parchment truncate">{tk.label}</p>
                        <p className="font-rune text-xs text-gold-bright tracking-wider truncate">{tk.code}</p>
                      </div>
                      {tk.used ? (
                        <CheckCircle2 size={16} className="text-emerald shrink-0" />
                      ) : (
                        <Circle size={16} className="text-muted shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Zone hors-écran utilisée pour générer le PDF imprimable */}
      <div ref={printRef} className="fixed -left-[9999px] top-0 flex flex-col gap-4">
        {tickets.map((tk) => (
          <div key={tk.id} className="ticket-card flex items-center gap-4 p-5 rounded-2xl border-2 border-gold-dim bg-void-panel" style={{ width: 340, height: 220 }}>
            {qrImages[tk.code] && <img src={qrImages[tk.code]} alt="QR" className="w-32 h-32 rounded-xl bg-parchment shrink-0" />}
            <div>
              <p className="font-display text-lg text-gold-bright">{tk.label}</p>
              <p className="font-rune text-2xl text-parchment tracking-widest mt-2">{tk.code}</p>
              <p className="text-xs text-muted mt-2">{t("tix_print_hint")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
