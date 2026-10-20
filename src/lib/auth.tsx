import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "./supabase";
import { isSupabaseConfigured } from "./env";
import { verifyAdminCredentials } from "./server-auth";

interface AuthState {
  email: string | null;
  loading: boolean;
  mode: "supabase" | "server";
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SESSION_KEY = "solemar.admin.session";

// Hash SHA-256 criptografado da senha inicial configurada pelo proprietário
const OWNER_PASSWORD_HASH = "6b4febbbb829331c75bbd78e3622b939f23cc28c73f38d6b777e43195a6028d9";
const AUTHORIZED_EMAILS = ["admn@solemar.com", "admin@solemar.com"];

async function computeSha256(text: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return "";
}

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
    setEmail(window.localStorage.getItem(SESSION_KEY));
    setLoading(false);
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (mail: string, password: string) => {
    const normalizedEmail = (mail || "").trim().toLowerCase();

    // 1. Se houver Supabase configurado, tenta autenticar via Supabase
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (!error) return;
      } catch {
        // Fallback para validação segura caso o Supabase esteja desconectado
      }
    }

    // 2. Tenta validação via Server Function
    try {
      const res = await verifyAdminCredentials({
        data: {
          email: normalizedEmail,
          password,
        },
      });

      if (res && res.authenticated) {
        window.localStorage.setItem(SESSION_KEY, res.email);
        setEmail(res.email);
        return;
      }
    } catch {
      // Caso a server function não esteja acessível neste contexto, validação pelo hash criptográfico SHA-256
      const hash = await computeSha256(password);
      const isEmailValid = AUTHORIZED_EMAILS.includes(normalizedEmail);
      const isPasswordValid = hash === OWNER_PASSWORD_HASH;

      if (isEmailValid && isPasswordValid) {
        window.localStorage.setItem(SESSION_KEY, normalizedEmail);
        setEmail(normalizedEmail);
        return;
      }
      throw new Error("E-mail ou senha inválidos.");
    }

    throw new Error("E-mail ou senha inválidos.");
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignora erro ao deslogar
      }
    }
    window.localStorage.removeItem(SESSION_KEY);
    setEmail(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      email,
      loading,
      mode: isSupabaseConfigured ? "supabase" : "server",
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
