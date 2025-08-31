import type { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

type AuthCtx = { session: Session | null; loading: boolean };
const Ctx = createContext<AuthCtx>({ session: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let sub: { unsubscribe: () => void } | undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const s = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
    });
    sub = s.data?.subscription;

    return () => sub?.unsubscribe();
  }, []);

  return <Ctx.Provider value={{ session, loading }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
