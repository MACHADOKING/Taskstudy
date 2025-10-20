import { createContext } from 'react';

export type Language = 'en' | 'pt-BR';
export type Theme = 'light' | 'dark';

export interface SettingsContextType {
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleLanguage: () => void;
  toggleTheme: () => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);