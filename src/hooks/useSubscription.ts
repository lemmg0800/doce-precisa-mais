import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export type Assinatura = {
  user_id: string;
  status: string;
  plano: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
};

export type AccessInfo = {
  loading: boolean;
  hasAccess: boolean;
  reason: "trial" | "ativo" | "atrasado_tolerancia" | "expirado" | "sem_assinatura";
  trialDaysLeft: number | null;
  graceDaysLeft: number | null;
  assinatura: Assinatura | null;
  refresh: () => Promise<void>;
};

function diffDays(target: Date) {
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useSubscription(): AccessInfo {
  const { user, ready } = useAuth();
  const location = useLocation();
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef<number>(0);

  const load = useCallback(
    async (silent = false) => {
      if (!user) {
        setAssinatura(null);
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      const { data } = await supabase
        .from("assinaturas")
        .select("user_id,status,plano,current_period_end,trial_ends_at")
        .eq("user_id", user.id)
        .maybeSingle();
      setAssinatura(data as Assinatura | null);
      lastFetchRef.current = Date.now();
      if (!silent) setLoading(false);
    },
    [user],
  );

  // Initial load when auth becomes ready / user changes
  useEffect(() => {
    if (!ready) return;
    load(false);
  }, [ready, load]);

  // Silent refresh on route change (only if stale > 30s)
  useEffect(() => {
    if (!ready || !user) return;
    if (Date.now() - lastFetchRef.current < 30_000) return;
    load(true);
  }, [location.pathname, ready, user, load]);

  // Silent background refresh
  useEffect(() => {
    if (!ready || !user) return;
    const id = setInterval(() => load(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [ready, user, load]);

  let hasAccess = false;
  let reason: AccessInfo["reason"] = "sem_assinatura";
  let trialDaysLeft: number | null = null;
  let graceDaysLeft: number | null = null;

  if (assinatura) {
    const now = new Date();
    const trialEnd = assinatura.trial_ends_at ? new Date(assinatura.trial_ends_at) : null;
    const periodEnd = assinatura.current_period_end ? new Date(assinatura.current_period_end) : null;

    if (assinatura.status === "ativo" && periodEnd && periodEnd >= now) {
      hasAccess = true;
      reason = "ativo";
    } else if (assinatura.status === "atrasado" && periodEnd) {
      const grace = new Date(periodEnd.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (grace >= now) {
        hasAccess = true;
        reason = "atrasado_tolerancia";
        graceDaysLeft = Math.max(0, diffDays(grace));
      } else {
        reason = "expirado";
      }
    } else if (trialEnd && trialEnd >= now) {
      hasAccess = true;
      reason = "trial";
      trialDaysLeft = Math.max(0, diffDays(trialEnd));
    } else {
      reason = "expirado";
    }
  }

  return {
    loading: loading || !ready,
    hasAccess,
    reason,
    trialDaysLeft,
    graceDaysLeft,
    assinatura,
    refresh: load,
  };
}
