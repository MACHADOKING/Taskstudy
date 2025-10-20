import { useSettings } from './useSettings';
import { translations, TranslationKey } from '../utils/translations';

export const useTranslation = () => {
  const { language } = useSettings();

  const t = (key: TranslationKey): string => {
    const currentLanguage = language || 'en';
    return translations[currentLanguage][key] || key;
  };

  return { t, language };
};