import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { WarningIcon, CheckIcon } from './Icons';

const CONSENT_VERSION = 'clinical-consent-v2';
const STORAGE_KEY = 'camdiag_clinical_consent_v2';

const shouldOpenInitially = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true;
    const parsed = JSON.parse(stored) as { version?: string };
    return parsed.version !== CONSENT_VERSION;
  } catch {
    return true;
  }
};

const initialAcknowledgements = {
  clinicalReview: false,
  emergencyCare: false,
  privacyUse: false,
};

/**
 * Required clinical consent and privacy gate.
 * Stored in localStorage with a version so material consent changes can be
 * re-presented without clearing all app data.
 */
export const MedicalDisclaimer = () => {
  const { language } = useTranslation();
  const [open, setOpen] = useState<boolean>(shouldOpenInitially);
  const [acknowledgements, setAcknowledgements] = useState(initialAcknowledgements);

  const text = useMemo(() => ({
    title: language === 'fr' ? 'Consentement clinique et confidentialite'
      : language === 'pcm' ? 'Clinical Consent & Privacy'
      : 'Clinical Consent & Privacy',
    body: language === 'fr'
      ? "CamDiag est un outil d'aide a la decision pour professionnels de sante. Il analyse des documents medicaux et peut traiter des donnees sensibles. Il ne remplace pas un clinicien, ne gere pas les urgences, et les resultats doivent etre verifies avant toute decision."
      : language === 'pcm'
      ? 'CamDiag na clinical decision helper for health workers. E fit process sensitive medical document data. E no replace doctor, e no handle emergency, and clinician must check result before any decision.'
      : 'CamDiag is a clinical decision-support tool for healthcare professionals. It reviews medical documents and may process sensitive health data. It does not replace a clinician, does not handle emergencies, and outputs must be verified before any decision.',
    checks: {
      clinicalReview: language === 'fr'
        ? "Je comprends que CamDiag ne pose pas de diagnostic et que toute observation IA exige une revue clinique."
        : language === 'pcm'
        ? 'I understand say CamDiag no dey diagnose and clinician must review any AI finding.'
        : 'I understand CamDiag does not diagnose, and every AI finding requires clinician review.',
      emergencyCare: language === 'fr'
        ? "Je comprends que les signes d'urgence exigent des soins immediats, pas une analyse IA."
        : language === 'pcm'
        ? 'I understand say emergency signs need urgent care, no be AI analysis.'
        : 'I understand emergency warning signs require immediate care, not AI analysis.',
      privacyUse: language === 'fr'
        ? "Je consens a l'utilisation de donnees de sante pour fournir l'analyse, l'audit de securite, les limites de debit et l'amelioration controlee du service."
        : language === 'pcm'
        ? 'I consent make health data help provide analysis, security audit, rate limits, and controlled service improvement.'
        : 'I consent to health data use for analysis delivery, security auditing, rate limiting, and controlled service improvement.',
    },
    privacyNote: language === 'fr'
      ? "Les images et resultats medicaux doivent etre partages uniquement avec des professionnels autorises. N'entrez pas de donnees non necessaires."
      : language === 'pcm'
      ? 'Share medical images and results only with authorized health workers. No enter extra data wey no necessary.'
      : 'Share medical images and results only with authorized care teams. Do not enter unnecessary personal data.',
    button: language === 'fr' ? "J'accepte et je continue" : language === 'pcm' ? 'I Accept & Continue' : 'I Accept & Continue',
  }), [language]);

  const canAccept = Object.values(acknowledgements).every(Boolean);

  const toggleAcknowledgement = (key: keyof typeof acknowledgements) => {
    setAcknowledgements((current) => ({ ...current, [key]: !current[key] }));
  };

  const accept = () => {
    if (!canAccept) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: CONSENT_VERSION,
        acceptedAt: new Date().toISOString(),
        acknowledgements,
      }));
    } catch {
      // localStorage may be unavailable (private mode, quota exceeded)
    }
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] glass-dark flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="medical-disclaimer-title"
        >
          <motion.div
            initial={{ scale: 0.92, y: 30, opacity: 0, filter: 'blur(8px)' }}
            animate={{ scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-white border-t-4 border-cameroon-red rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-premium relative"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-cameroon-flag rounded-t-3xl" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-cameroon-red/15 text-cameroon-red flex items-center justify-center">
                <WarningIcon className="w-7 h-7" />
              </div>
              <h2 id="medical-disclaimer-title" className="text-xl font-black text-cameroon-night">{text.title}</h2>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-5">{text.body}</p>

            <div className="space-y-3 mb-5">
              {Object.entries(text.checks).map(([key, label]) => {
                const typedKey = key as keyof typeof acknowledgements;
                return (
                  <label
                    key={key}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-cameroon-green/15 bg-cameroon-green/5 p-3 text-xs font-semibold text-cameroon-green-deep"
                  >
                    <input
                      type="checkbox"
                      checked={acknowledgements[typedKey]}
                      onChange={() => toggleAcknowledgement(typedKey)}
                      className="mt-0.5 h-4 w-4 rounded border-cameroon-green text-cameroon-green focus:ring-cameroon-green"
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>

            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-900">
              {text.privacyNote}
            </div>

            <button
              type="button"
              onClick={accept}
              disabled={!canAccept}
              className="w-full bg-cameroon-green text-white font-black py-3.5 rounded-xl shadow-cameroon hover:bg-cameroon-green-deep transition-colors disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <CheckIcon className="w-4 h-4" />
                {text.button}
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
