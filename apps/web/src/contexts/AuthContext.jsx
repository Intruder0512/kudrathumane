import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext(null);

// Combine the Supabase auth user with their row in public.profiles (name, phone, role…)
const loadProfile = async (user) => {
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return {
    id: user.id,
    email: user.email,
    name: data?.name || user.user_metadata?.name || '',
    phone: data?.phone || '',
    address: data?.address || '',
    role: data?.role || 'user',
    ...data,
  };
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const profile = await loadProfile(data?.session?.user);
      if (active) {
        setCurrentUser(profile);
        setInitialLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer DB calls out of the auth callback (recommended by Supabase)
      setTimeout(async () => {
        const profile = await loadProfile(session?.user);
        if (active) setCurrentUser(profile);
      }, 0);
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profile = await loadProfile(data.user);
    setCurrentUser(profile);
    return profile;
  }, []);

  const signup = useCallback(async (email, password, passwordConfirm, name, phone, address) => {
    if (passwordConfirm !== undefined && password !== passwordConfirm) {
      throw new Error('Passwords do not match');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone, address } },
    });
    if (error) throw error;
    if (!data.session) {
      throw new Error('Account created! Please check your email to confirm it, then log in.');
    }
    const profile = await loadProfile(data.user);
    setCurrentUser(profile);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }, []);

  const isAdmin = currentUser?.role === 'admin';
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, login, signup, logout, isAdmin, isAuthenticated, initialLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
