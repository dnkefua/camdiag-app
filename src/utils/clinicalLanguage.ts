import type { Language } from '../types';

export const clinicalLanguage = (language: Language): 'en' | 'fr' =>
  language === 'fr' ? 'fr' : 'en';
export const clinicalText = (language: Language, english: string, french: string): string =>
  language === 'fr' ? french : english;
export const clinicalLanguageNotice = (language: Language): string =>
  language === 'fr'
    ? 'Aide expérimentale à la revue de documents. Les résultats cliniques sont en français et nécessitent la revue d’un clinicien autorisé.'
    : language === 'pcm'
      ? 'Clinical safety instructions and results are in English. Pidgin clinical translation has not been validated. Investigational document review requires an authorized clinician.'
      : 'Investigational document review. Clinical results are in English and require an authorized clinician’s review.';
