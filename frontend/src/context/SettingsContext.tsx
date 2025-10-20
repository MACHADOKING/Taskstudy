import React, { useState, useEffect, ReactNode } from 'react';
import { SettingsContext, type Language, type Theme, type SettingsContextType } from './SettingsContextDefinition';

export type { Language, Theme, SettingsContextType };

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('pt-BR');
  const [theme, setThemeState] = useState<Theme>('light');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('taskstudy-language') as Language;
    const savedTheme = localStorage.getItem('taskstudy-theme') as Theme;

    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'pt-BR')) {
      setLanguageState(savedLanguage);
    }

    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setThemeState(savedTheme);
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('taskstudy-language', newLanguage);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('taskstudy-theme', newTheme);
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'pt-BR' : 'en';
    setLanguage(newLanguage);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <SettingsContext.Provider
      value={{
        language,
        theme,
        setLanguage,
        setTheme,
        toggleLanguage,
        toggleTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};