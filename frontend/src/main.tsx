import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './styles/accessibility.css';
import { initializePortugueseLanguage } from './utils/initLanguage';

// Initialize Portuguese as default language
initializePortugueseLanguage();

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const AppWithProviders = googleClientId ? (
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>
) : (
  <App />
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {AppWithProviders}
  </React.StrictMode>
);