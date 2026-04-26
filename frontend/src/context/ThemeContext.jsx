/**
 * ThemeContext — Manages 3 themes: Light, Dark, and Eye Comfort.
 * Persists preference to LocalStorage.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);

    // Sync to Firebase if logged in
    if (auth?.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid), { theme }, { merge: true })
        .catch(err => console.error('Error syncing theme:', err));
    }
  }, [theme]);

  // Load from Firebase on mount if available
  useEffect(() => {
    const unsub = auth?.onAuthStateChanged(async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists() && docSnap.data().theme) {
          setTheme(docSnap.data().theme);
        }
      }
    });
    return unsub;
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'comfort';
      return 'light';
    });
  };

  const setThemeExplicit = (mode) => setTheme(mode);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeExplicit }}>
      {children}
    </ThemeContext.Provider>
  );
};
