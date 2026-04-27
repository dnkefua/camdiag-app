import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { WarningIcon, CheckIcon } from './Icons';

const STORAGE_KEY = 'camdiag_disclaimer_accepted_v1';

const shouldOpenInitially = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
};

/**
 * Required medical-context modal shown once per device.
 * Stored in localStorage; reset by clearing the key.
 *
 * Why: shipping a clinical-decision-support tool without an explicit
 * "this is not a diagnosis" gate is a regulatory risk.
 */
export const MedicalDisclaimer = () => {
  const { language } = useTranslation();
  const [open, setOpen] = useState<boolean>(shouldOpenInitially);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // localStorage may be unavailable (private mode, quota exceeded)
    }
    setOpen(false);
  };

  const text = {
    title: language === 'fr' ? 'Avis médical important'
      : language === 'pcm' ? 'Medical Notice'
      : 'Important Medical Notice',
    body: language === 'fr'
      ? "CamDiag est un outil d'aide à la décision destiné aux professionnels de santé. Il ne remplace JAMAIS le jugement clinique d'un médecin agréé, et n'est pas approuvé pour un usage diagnostique en autonomie. En cliquant sur \"J'ai compris\", vous reconnaissez que les résultats de l'IA sont indicatifs et doivent être validés par un professionnel."
      : language === 'pcm'
      ? 'CamDiag na helper for decision wey health workers go use. E no fit replace proper doctor advice. When you click "I Understand", you sabi say AI result na guide and doctor must check am.'
      : 'CamDiag is a decision-support tool for healthcare professionals. It does NOT replace the clinical judgment of a licensed physician, and is not approved for standalone diagnostic use. By tapping "I Understand", you acknowledge that AI outputs are indicative and must be validated by a qualified clinician.',
    button: language === 'fr' ? "J'ai compris" : language === 'pcm' ? 'I Understand' : 'I Understand',
    bullets: [
      language === 'fr' ? 'Pas un substitut au jugement clinique' : 'Not a substitute for clinical judgment',
      language === 'fr' ? 'Toujours valider avec un médecin' : 'Always validate with a clinician',
      language === 'fr' ? 'Données sensibles — usage professionnel' : 'Sensitive data — professional use only',
    ],
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
            className="bg-white border-t-4 border-cameroon-red rounded-3xl p-8 w-full max-w-md shadow-premium relative"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-cameroon-flag rounded-t-3xl" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-cameroon-red/15 text-cameroon-red flex items-center justify-center">
                <WarningIcon className="w-7 h-7" />
              </div>
              <h2 id="medical-disclaimer-title" className="text-xl font-black text-cameroon-night">{text.title}</h2>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-5">{text.body}</p>
            <ul className="space-y-2 mb-6">
              {text.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-xs font-semibold text-cameroon-green-deep">
                  <CheckIcon className="w-4 h-4 text-cameroon-green" />
                  {b}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={accept}
              className="w-full bg-cameroon-green text-white font-black py-3.5 rounded-xl shadow-cameroon hover:bg-cameroon-green-deep transition-colors"
            >
              {text.button}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
