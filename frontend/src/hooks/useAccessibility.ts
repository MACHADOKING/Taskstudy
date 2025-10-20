import { useState, useEffect, useCallback } from 'react';

export interface AccessibilitySettings {
  screenReaderMode: boolean;
  highContrast: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  reduceAnimations: boolean;
  voiceCommands: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  screenReaderMode: false,
  highContrast: false,
  largeText: false,
  keyboardNavigation: true, // Always enable keyboard navigation
  reduceAnimations: false,
  voiceCommands: false,
};

export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    }

    // Check for system preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSettings(prev => ({ ...prev, reduceAnimations: true }));
    }

    if (window.matchMedia('(prefers-contrast: high)').matches) {
      setSettings(prev => ({ ...prev, highContrast: true }));
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    
    // Apply CSS classes to document for global accessibility features
    const docElement = document.documentElement;
    
    docElement.classList.toggle('accessibility-high-contrast', settings.highContrast);
    docElement.classList.toggle('accessibility-large-text', settings.largeText);
    docElement.classList.toggle('accessibility-reduced-motion', settings.reduceAnimations);
    docElement.classList.toggle('accessibility-screen-reader', settings.screenReaderMode);
  }, [settings]);

  const updateSetting = useCallback((key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleSetting = useCallback((key: keyof AccessibilitySettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return {
    settings,
    updateSetting,
    toggleSetting,
    announceToScreenReader,
    focusElement,
  };
};