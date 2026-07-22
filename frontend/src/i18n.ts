import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import plTranslation from './locales/pl.json';

const forceLng = import.meta.env.VITE_APP_LANGUAGE;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      pl: {
        translation: plTranslation,
      },
    },
    fallbackLng: 'en',
    lng: forceLng || undefined,
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
  });

export default i18n;
