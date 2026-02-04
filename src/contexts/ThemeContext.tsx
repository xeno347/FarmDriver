import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('theme');
        if (isMounted && stored === 'dark') setIsDarkMode(true);
      } catch {
        // If AsyncStorage isn't available (mislinked) or fails, fall back to default.
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTheme = async () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      (async () => {
        try {
          await AsyncStorage.setItem('theme', next ? 'dark' : 'light');
        } catch {
          // Ignore persistence errors; UI state still updates.
        }
      })();
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
