import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("AuthContext: Initializing auth check...");
      if (pb.authStore.isValid) {
        try {
          console.log("AuthContext: Refreshing token...");
          const authData = await pb.collection('users').authRefresh({ $autoCancel: false });
          console.log("AuthContext: Token refreshed successfully.", authData.record);
          setCurrentUser(authData.record);
        } catch (err) {
          console.error("AuthContext: Token refresh failed:", err);
          pb.authStore.clear();
          setCurrentUser(null);
        }
      } else {
        console.log("AuthContext: No valid token found.");
        setCurrentUser(null);
      }
      setInitialLoading(false);
    };
    
    checkAuth();

    const unsubscribe = pb.authStore.onChange((token, model) => {
      console.log("AuthContext: Auth store changed.", { hasToken: !!token, modelEmail: model?.email, modelRole: model?.role });
      setCurrentUser(model);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    console.log("AuthContext: login function called with email:", email);
    const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
    console.log("AuthContext: authWithPassword successful.", authData.record);
    setCurrentUser(authData.record);
    return authData.record;
  };

  const signup = async (email, password, passwordConfirm, name, phone, address) => {
    console.log("AuthContext: signup function called.");
    const record = await pb.collection('users').create({
      email,
      password,
      passwordConfirm,
      name,
      phone,
      address,
      role: 'user'
    }, { $autoCancel: false });
    
    await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
    setCurrentUser(pb.authStore.model);
    return record;
  };

  const logout = () => {
    console.log("AuthContext: logout function called.");
    pb.authStore.clear();
    setCurrentUser(null);
  };

  const isAdmin = currentUser?.role === 'admin';
  const isAuthenticated = !!currentUser;

  console.log("AuthContext: Current State ->", { 
    email: currentUser?.email, 
    role: currentUser?.role,
    isAdmin, 
    isAuthenticated, 
    initialLoading 
  });

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