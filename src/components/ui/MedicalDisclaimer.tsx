import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { CONSENT_VERSION, CONSENT_CHANGED_EVENT, getClinicalConsent, saveClinicalConsent } from '../../services/consent';
import { getAnalyticsConsent, setAnalyticsConsent } from '../../services/privacy';
import { WarningIcon } from './Icons';

const sensitivePaths = new Set(['/scanner', '/transcription-review', '/analysis', '/patients', '/drugs', '/next-steps']);
const initialAcknowledgements = { clinicalReview: false, emergencyCare: false, privacyUse: false };

/** Verify account-bound consent before clinical route children mount. */
export const MedicalDisclaimer = ({ children }: { children?: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const { language } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const required = Boolean(isAuthenticated && user?.uid && sensitivePaths.has(location.pathname));
  const [state, setState] = useState<{ key?: string; status: 'loading' | 'required' | 'accepted' | 'error' }>({ status: 'loading' });
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [acknowledgements, setAcknowledgements] = useState(initialAcknowledgements);
  const [analytics, setAnalytics] = useState(getAnalyticsConsent);
  const fr = language === 'fr';
  const consentKey = `${user?.uid ?? ''}:${location.pathname}:${revision}`;
  const open = required && !(state.key === consentKey && state.status === 'accepted');
  const dialogRef = useDialogFocus(open, () => { void navigate('/app'); });

  useEffect(() => {
    const changed = () => setRevision((value) => value + 1);
    window.addEventListener(CONSENT_CHANGED_EVENT, changed);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, changed);
  }, []);
  useEffect(() => {
    if (!required || !user?.uid) return;
    let active = true;
    const key = consentKey;
    setState({ key, status: 'loading' });
    setAcknowledgements(initialAcknowledgements);
    setError(false);
    void getClinicalConsent().then((consent) => {
      if (active) setState({ key, status: consent?.version === CONSENT_VERSION && consent.clinicalProcessing ? 'accepted' : 'required' });
    }).catch(() => { if (active) setState({ key, status: 'error' }); });
    return () => { active = false; };
  }, [required, user?.uid, consentKey]);

  const accept = async () => {
    if (!Object.values(acknowledgements).every(Boolean) || saving || !user?.uid) return;
    const key = consentKey;
    setSaving(true); setError(false);
    try {
      await saveClinicalConsent(true, analytics);
      setAnalyticsConsent(analytics);
      setState({ key, status: 'accepted' });
    } catch { setError(true); }
    finally { setSaving(false); }
  };
  if (!open) return <>{children}</>;
  const loading = state.key !== consentKey || state.status === 'loading';
  const checks = {
    clinicalReview: fr ? 'Je comprends que CamDiag ne pose pas de diagnostic et que chaque observation IA exige une revue clinique.' : 'I understand CamDiag does not diagnose, and every AI finding requires clinician review.',
    emergencyCare: fr ? 'Je comprends que les signes d’urgence nécessitent des soins immédiats, sans attendre l’IA.' : 'I understand emergency warning signs require immediate care without waiting for AI.',
    privacyUse: fr ? 'Je suis autorisé à traiter ces informations. Je consens au traitement des données de santé nécessaire à la transcription, à la revue demandée, à la conservation du dossier et à la sécurité du service.' : 'I am authorized to process this information. I consent to health data use needed for transcription, the requested review, record storage and service security.',
  };
  return (
    <div className="fixed inset-0 z-[2000] glass-dark flex items-center justify-center p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="medical-disclaimer-title" aria-describedby="medical-disclaimer-description" tabIndex={-1} className="bg-white border-t-4 border-cameroon-red rounded-3xl p-6 sm:p-8 w-full max-w-xl max-h-[90dvh] overflow-y-auto shadow-premium text-slate-900">
        <div className="flex items-center gap-3 mb-4"><WarningIcon className="w-7 h-7 text-cameroon-red" /><h2 id="medical-disclaimer-title" className="text-xl font-black">{fr ? 'Consentement clinique et confidentialité' : 'Clinical Consent & Privacy'}</h2></div>
        <p id="medical-disclaimer-description" className="text-sm mb-4">{fr ? 'CamDiag est un outil expérimental de revue documentaire. Il ne remplace pas le jugement d’un professionnel. Une connexion internet est requise. Les documents sont traités via Firebase et Google Cloud.' : 'CamDiag is an investigational document-review tool. It does not replace professional judgment. Internet access is required. Documents are processed using Firebase and Google Cloud.'}</p>
        {language === 'pcm' && <p className="text-sm mb-4">Clinical consent and clinical output are shown in English in Pidgin interface mode.</p>}
        {loading ? <p role="status">{fr ? 'Vérification du consentement…' : 'Checking consent…'}</p> : state.status === 'error' ? (
          <div role="alert" className="space-y-3"><p>{fr ? 'Le consentement ne peut pas être vérifié. Aucun traitement clinique ne peut commencer.' : 'Consent could not be verified. Clinical processing cannot start.'}</p><button type="button" className="underline" onClick={() => setRevision((value) => value + 1)}>{fr ? 'Réessayer' : 'Retry'}</button></div>
        ) : <>
          <div className="space-y-3">{Object.entries(checks).map(([key, label]) => <label key={key} className="flex items-start gap-3 rounded-xl border border-cameroon-green/20 bg-cameroon-green/5 p-3 text-sm"><input type="checkbox" checked={acknowledgements[key as keyof typeof acknowledgements]} onChange={(event) => setAcknowledgements((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 h-4 w-4 shrink-0" /><span>{label}</span></label>)}</div>
          <label className="flex items-start gap-3 mt-4 p-3 border rounded-xl text-sm"><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="mt-1 h-4 w-4 shrink-0" /><span>{fr ? 'Facultatif : autoriser les statistiques d’utilisation sans contenu clinique. Ce choix n’affecte pas l’accès clinique.' : 'Optional: allow usage analytics without clinical content. This choice does not affect clinical access.'}</span></label>
          <p className="text-xs leading-relaxed mt-4">{fr ? 'Vous pouvez retirer ce consentement dans Paramètres. Cela bloque les nouveaux traitements mais ne supprime pas les dossiers existants. Les durées de conservation des journaux, sauvegardes et prestataires ne sont pas encore toutes confirmées pour la production.' : 'You can withdraw consent in Settings. Withdrawal blocks new processing but does not delete existing records. Retention periods for logs, backups and providers have not all been confirmed for production.'} <a href="/privacy.html" target="_blank" rel="noreferrer" className="underline text-cameroon-green">{fr ? 'Confidentialité et conservation' : 'Privacy and retention'}</a></p>
          {error && <p role="alert" className="text-sm text-red-700 mt-3">{fr ? 'Le consentement n’a pas été enregistré. Réessayez.' : 'Consent was not saved. Please retry.'}</p>}
          <button type="button" disabled={saving || !Object.values(acknowledgements).every(Boolean)} onClick={() => { void accept(); }} className="w-full mt-5 bg-cameroon-green text-white font-black py-3 rounded-xl disabled:bg-slate-300">{saving ? (fr ? 'Enregistrement…' : 'Saving…') : (fr ? 'J’accepte et je continue' : 'I Accept & Continue')}</button>
        </>}
        <button type="button" onClick={() => navigate('/app')} className="w-full mt-3 py-3 text-sm font-bold underline">{fr ? 'Revenir sans accepter' : 'Go back without accepting'}</button>
      </div>
    </div>
  );
};
