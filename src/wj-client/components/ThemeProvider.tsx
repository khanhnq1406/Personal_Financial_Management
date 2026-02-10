"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// Dark mode temporarily disabled
type Theme = "light"; // "dark" | "system" removed - only light theme available

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light"; // Always light now
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// THEME_STORAGE_KEY temporarily unused while dark mode is disabled
// const THEME_STORAGE_KEY = "wealthjourney-theme";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  // storageKey temporarily unused while dark mode is disabled
  // storageKey?: string;
}

export function ThemeProvider({
  children,
  // Props temporarily unused while dark mode is disabled
  // defaultTheme = "light",
  // storageKey temporarily unused while dark mode is disabled
}: ThemeProviderProps) {
  // Dark mode temporarily disabled - always use light theme
  const [theme] = useState<Theme>("light");

  const resolvedTheme: "light" = "light";

  // Update theme in localStorage and apply to document
  // Dark mode temporarily disabled - always use light theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark"); // Remove dark class if present
    root.classList.add("light");
    // resolvedTheme is always "light" now, no state update needed
  }, [theme]);

  // Listen for system theme changes - DISABLED
  // Dark mode temporarily disabled, so we don't need to listen for system changes

  // Prevent flash of wrong theme on page load
  // Dark mode temporarily disabled - always use light theme
  useEffect(() => {
    // Inject script to set light theme before page loads
    const script = document.createElement("script");
    script.textContent = `
      (function() {
        const root = document.documentElement;
        root.classList.remove('dark');
        root.classList.add('light');
      })();
    `;
    script.id = "theme-script";
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Dark mode temporarily disabled - setTheme does nothing but keeps API compatibility
  const setTheme = (_newTheme: Theme) => {
    // No-op - theme is always light
    // Keep function for API compatibility with existing code
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
