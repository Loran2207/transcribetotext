import { createContext, useContext, type ReactNode } from "react";

interface ThemeContextValue {
  theme: "light";
  toggleTheme: () => void;
  isDark: false;
  navStyle: "light";
  setNavStyle: (s: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
  isDark: false,
  navStyle: "light",
  setNavStyle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value: ThemeContextValue = {
    theme: "light",
    toggleTheme: () => {},
    isDark: false,
    navStyle: "light",
    setNavStyle: () => {},
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}