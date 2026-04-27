import { useContext, createContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../types';
import en from '../i18n/en.json';
import fr from '../i18n/fr.json';

type TranslationKeys = keyof typeof en;
type Translations = Record<TranslationKeys, string>;

const translations: Record<Language, Translations> = { en, fr };

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: en as unknown as Translations,
});

export const useTranslation = () => useContext(LanguageContext);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};