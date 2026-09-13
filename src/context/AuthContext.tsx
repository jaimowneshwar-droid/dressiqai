import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Customer } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isCustomer: boolean;
  customer: Customer | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isAdmin: false,
  isCustomer: false,
  customer: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshCustomer: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session);
      if (!data.session) {
        setIsAdmin(false);
        setCustomer(null);
        setLoading(false);
      }
    };

    initializeSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      // Only update React state here. Do not perform Supabase queries from
      // inside the auth callback; doing so can re-enter the auth machinery
      // and cause a recursive update/stack overflow in production.
      setSession(newSession);
      if (!newSession) {
        setIsAdmin(false);
        setCustomer(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!session?.user?.id) return;

    setLoading(true);
    checkAuth(session.user.id).finally(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  async function checkAuth(userId: string) {
    const [adminRes, custRes] = await Promise.all([
      supabase.from('admins').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('customers').select('*').eq('user_id', userId).maybeSingle(),
    ]);
    setIsAdmin(!!adminRes.data);
    setCustomer((custRes.data as Customer) ?? null);
    setLoading(false);
  }

  async function refreshCustomer() {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
    setCustomer((data as Customer) ?? null);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, name: string, phone: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    });
    if (error) return { error: error.message };

    if (data.user) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        await supabase.from('customers').update({ user_id: data.user.id, name, phone }).eq('id', existing.id);
      } else {
        await supabase.from('customers').insert({
          user_id: data.user.id,
          name,
          email,
          phone,
          total_orders: 0,
          total_spent: 0,
        });
      }

      if (data.session) {
        await checkAuth(data.user.id);
      }
    }
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
    setCustomer(null);
  }

  const isCustomer = !!session?.user && !isAdmin;

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      isAdmin,
      isCustomer,
      customer,
      loading,
      signIn,
      signUp,
      signOut,
      refreshCustomer,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
