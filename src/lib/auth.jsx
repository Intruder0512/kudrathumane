import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

async function loadProfile(user) {
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return {
    id: user.id,
    email: user.email,
    full_name: data?.full_name || user.user_metadata?.full_name || '',
    phone: data?.phone || user.user_metadata?.phone || '',
    address: data?.address || '',
    role: data?.role || 'supporter',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        const p = await loadProfile(data?.session?.user);
        if (alive) setUser(p);
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setTimeout(async () => {
        const p = await loadProfile(session?.user);
        if (alive) setUser(p);
      }, 0);
    });
    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const p = await loadProfile(data.user);
    setUser(p);
    return p;
  }, []);

  const signUp = useCallback(async ({ email, password, full_name, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, phone }, emailRedirectTo: `${window.location.origin}/account` },
    });
    if (error) throw error;
    if (!data.session) return { needsConfirmation: true };
    const p = await loadProfile(data.user);
    setUser(p);
    return { user: p };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/account?reset=1` });
    if (error) throw error;
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUser(await loadProfile(data?.user));
  }, []);

  const value = {
    user,
    ready,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'admin' || user?.role === 'volunteer',
    signIn,
    signUp,
    signOut,
    resetPassword,
    refresh,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
