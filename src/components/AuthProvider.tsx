import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { usePricingStore } from "@/store/usePricingStore";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  ready: boolean;
}

const Ctx = createContext<AuthCtx>({ session: null, user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const reset = usePricingStore((s) => s.reset);
  const loadAll = usePricingStore((s) => s.loadAll);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // Only (re)load on real sign-in / sign-out events.
      // Ignore TOKEN_REFRESHED / USER_UPDATED / INITIAL_SESSION which fire on tab focus
      // and would otherwise reset stores and unmount forms in progress.
      if (event === "SIGNED_IN") {
        setTimeout(() => {
          loadAll().catch(() => {});
        }, 0);
      } else if (event === "SIGNED_OUT") {
        reset();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
      if (data.session) loadAll().catch(() => {});
    });
    return () => sub.subscription.unsubscribe();
  }, [loadAll, reset]);

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, ready }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
