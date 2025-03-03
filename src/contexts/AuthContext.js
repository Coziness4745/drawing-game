import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { signInAnonymously, updateProfile } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Function to sign in anonymously and set a display name
  const login = async (displayName) => {
    try {
      const result = await signInAnonymously(auth);
      await updateProfile(result.user, { displayName });
      setCurrentUser({ ...result.user, displayName });
      return result.user;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  // Function to sign out
  const logout = () => {
    return auth.signOut();
  };

  const value = {
    currentUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}