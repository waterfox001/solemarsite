import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "./supabase";
import { DEMO_ADMIN, isSupabaseConfigured } from "./env";

interface AuthState {
  email: string | null;
  loading: boolean;
  mode: "supabase" | "demo";
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const DEMO_KEY = "solemar.admin.session";

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        setEmail(data.session?.user.email ?? null);
        setLoading(false);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setEmail(session?.user.email ?? null);
      });
      return () => {
        active = false;
        sub.subscription.unsubscribe();
      };
    }
    setEmail(window.localStorage.getItem(DEMO_KEY));
    setLoading(false);
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (mail: string, password: string) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
      if (error) throw new Error("E-mail ou senha inválidos.");
      return;
    }
    if (
      mail.trim().toLowerCase() !== DEMO_ADMIN.email.toLowerCase() ||
      password !== DEMO_ADMIN.password
    ) {
      throw new Error("E-mail ou senha inválidos.");
    }
    window.localStorage.setItem(DEMO_KEY, mail.trim());
    setEmail(mail.trim());
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setEmail(null);
      return;
    }
    window.localStorage.removeItem(DEMO_KEY);
    setEmail(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      email,
      loading,
      mode: isSupabaseConfigured ? "supabase" : "demo",
      signIn,
      signOut,
    }),
    [email, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
