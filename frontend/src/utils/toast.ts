import { toast, ToastOptions } from 'react-toastify';
import { translations, TranslationKey } from './translations';

interface CustomToastOptions extends Omit<ToastOptions, 'type'> {
  autoClose?: number;
}

type SupportedLanguage = keyof typeof translations;

const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

const isTranslationKey = (value: string): value is TranslationKey => {
  return value in translations.en;
};

const getCurrentLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const stored = localStorage.getItem('taskstudy-language');
  if (stored && stored in translations) {
    return stored as SupportedLanguage;
  }

  return DEFAULT_LANGUAGE;
};

const resolveMessage = (value: string): string => {
  if (!isTranslationKey(value)) {
    return value;
  }

  const language = getCurrentLanguage();
  return translations[language][value];
};

export const showToast = {
  success: (message: string, options?: CustomToastOptions) => {
    toast.success(resolveMessage(message), {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  },

  error: (message: string, options?: CustomToastOptions) => {
    toast.error(resolveMessage(message), {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  },

  warning: (message: string, options?: CustomToastOptions) => {
    toast.warning(resolveMessage(message), {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  },

  info: (message: string, options?: CustomToastOptions) => {
    toast.info(resolveMessage(message), {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  },

  // Método para exibir erros da API de forma padronizada
  apiError: (error: unknown, fallbackMessage: string = 'toastUnknownError') => {
    let message = resolveMessage(fallbackMessage);

    // Type guard para verificar se é um erro do Axios
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      }
    } else if (error && typeof error === 'object' && 'message' in error) {
      const standardError = error as { message: string };
      message = standardError.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    toast.error(resolveMessage(message), {
      position: 'top-right',
      autoClose: 6000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },
};

export default showToast;