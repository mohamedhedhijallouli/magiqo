import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={cn("flex gap-1 overflow-x-auto pb-1 no-scrollbar", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "relative px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2",
            active === tab.value
              ? "text-gold-bright"
              : "text-muted hover:text-parchment hover:bg-white/5 border border-transparent"
          )}
        >
          {active === tab.value && (
            <motion.span
              layoutId="tab-indicator"
              className="absolute inset-0 rounded-xl bg-void-panel2 border border-gold-dim/60"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-xs bg-white/10 rounded-full px-1.5 py-0.5">{tab.count}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Badge({ children, color = "gold", className }) {
  const colors = {
    gold: "bg-gold/15 text-gold-bright border-gold-dim/40",
    emerald: "bg-emerald/15 text-emerald-bright border-emerald/40",
    arcane: "bg-arcane/15 text-arcane border-arcane-dim/40",
    ember: "bg-ember/15 text-ember-bright border-ember/40",
    muted: "bg-white/5 text-muted border-void-border",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border", colors[color], className)}>
      {children}
    </span>
  );
}

export function EmptyState({ icon = "✨", title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="text-5xl mb-3 opacity-70 animate-float">{icon}</div>
      <p className="font-display text-lg text-parchment mb-1">{title}</p>
      {subtitle && <p className="text-muted text-sm max-w-sm">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm dialog (replaces window.confirm with a themed modal)
// ---------------------------------------------------------------------------
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback(({ title, message, danger = true }) => {
    return new Promise((resolve) => {
      setState({ title, message, danger, resolve });
    });
  }, []);

  const handle = (result) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!state} onClose={() => handle(false)} title={state?.title || ""} maxWidth="max-w-sm">
        <div className="flex items-start gap-3 mb-6">
          <AlertTriangle className="text-ember shrink-0 mt-0.5" size={22} />
          <p className="text-parchment/90 text-sm leading-relaxed">{state?.message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => handle(false)}>Annuler</Button>
          <Button variant={state?.danger ? "danger" : "primary"} size="sm" onClick={() => handle(true)}>
            Confirmer
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Toast notifications
// ---------------------------------------------------------------------------
const ToastContext = createContext(null);
let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "success") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg backdrop-blur bg-void-panel/95 text-sm font-semibold",
                toast.type === "success" ? "border-emerald/50 text-emerald-bright" : "border-ember/50 text-ember-bright"
              )}
            >
              {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {toast.message}
              <button
                onClick={() => setToasts((t) => t.filter((x) => x.id !== toast.id))}
                className="ml-2 text-muted hover:text-parchment"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
