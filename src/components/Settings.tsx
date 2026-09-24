import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { updateUserProfile } from '../services/firestore';
import { CONSENT_VERSION, exportAccountData, getClinicalConsent, requestAccountDeletion, saveClinicalConsent } from '../services/consent';
import { getAnalyticsConsent, setAnalyticsConsent } from '../services/privacy';
import { resetSensitiveSession } from '../services/session';
import { BackIcon, HomeIcon, UsersIcon, CameraIcon, UserIcon, ShieldIcon, AlertIcon } from '../components/ui/Icons';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'about';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, language } = useTranslation();
  const fr = language === 'fr';
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [name, setName] = useState(user?.name || '');
  const photoUrl = user?.photoUrl?.startsWith('https://') ? user.photoUrl : '';
  const [about, setAbout] = useState(user?.about || '');
  const [scanResults, setScanResults] = useState(user?.notificationPrefs?.scanResults ?? true);
  const [medicationAlerts, setMedicationAlerts] = useState(user?.notificationPrefs?.medicationAlerts ?? true);
  const [productUpdates, setProductUpdates] = useState(user?.notificationPrefs?.productUpdates ?? false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState(getAnalyticsConsent);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');
  const [confirmDeletion, setConfirmDeletion] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setAbout(user?.about || '');
    setScanResults(user?.notificationPrefs?.scanResults ?? true);
    setMedicationAlerts(user?.notificationPrefs?.medicationAlerts ?? true);
    setProductUpdates(user?.notificationPrefs?.productUpdates ?? false);
  }, [user?.uid, user?.name, user?.about, user?.notificationPrefs?.scanResults, user?.notificationPrefs?.medicationAlerts, user?.notificationPrefs?.productUpdates]);

  const handleLogout = async () => {
    await logout();
    void navigate('/app');
  };

  const handleSave = async () => {
    if (!user?.uid || saveStatus === 'saving') return;
    setSaveStatus('saving');
    setError(null);

    try {
      await updateUserProfile(user.uid, {
        name: (name.trim() || user.name).slice(0, 120),
        about: about.slice(0, 1000),
        notificationPrefs: {
          scanResults,
          medicationAlerts,
          productUpdates,
        },
      });
      setSaveStatus('saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
      setSaveStatus('error');
    }
  };

  const accountAction = async (action: () => Promise<void>) => {
    if (accountBusy || !user?.uid) return;
    setAccountBusy(true); setAccountMessage(''); setAccountError('');
    try { await action(); }
    catch { setAccountError(fr ? 'Action non terminée. Pour un export ou une suppression, déconnectez-vous, reconnectez-vous et réessayez dans les cinq minutes. Vérifiez aussi votre connexion.' : 'Action not completed. For export or deletion, sign out, sign in again and retry within five minutes. Also check your connection.'); }
    finally { setAccountBusy(false); }
  };
  const handleAnalytics = (enabled: boolean) => {
    void accountAction(async () => {
      const consent = await getClinicalConsent();
      await saveClinicalConsent(consent?.version === CONSENT_VERSION && consent.clinicalProcessing === true, enabled);
      setAnalyticsConsent(enabled); setAnalytics(enabled);
      setAccountMessage(fr ? 'Préférence de statistiques enregistrée.' : 'Analytics preference saved.');
    });
  };
  const handleExport = () => {
    void accountAction(async () => {
      const data = await exportAccountData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url; link.download = `camdiag-account-${new Date().toISOString().slice(0, 10)}.json`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setAccountMessage(fr ? 'Export du compte téléchargé. Stockez ce fichier sensible dans un endroit sûr.' : 'Account export downloaded. Store this sensitive file securely.');
    });
  };
  const handleWithdrawal = () => {
    void accountAction(async () => {
      await saveClinicalConsent(false, analytics);
      resetSensitiveSession();
      setAccountMessage(fr ? 'Consentement clinique retiré. Les nouveaux traitements sont bloqués ; les dossiers existants ne sont pas supprimés.' : 'Clinical consent withdrawn. New processing is blocked; existing records have not been deleted.');
    });
  };
  const handleDeletionRequest = () => {
    void accountAction(async () => {
      const request = await requestAccountDeletion();
      setConfirmDeletion(false);
      setAccountMessage(fr ? `Demande ${request.id} enregistrée pour revue humaine. Aucune donnée n’a encore été supprimée.` : `Request ${request.id} is pending human review. No data has been deleted yet.`);
    });
  };

  const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: 'profile', label: t.profile },
    { id: 'notifications', label: t.notifications },
    { id: 'security', label: t.security },
    { id: 'about', label: t.about },
  ];

  return (
    <div className="bg-slate-50 text-slate-900 font-sans h-[100svh] h-[100dvh] flex flex-col overflow-hidden">
      <header className="bg-white border-b border-slate-200 shrink-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm safe-area-top">
        <button onClick={() => navigate('/app')} aria-label="Back" className="text-slate-600 p-1">
          <BackIcon />
        </button>
        <h1 className="text-xl font-bold text-cameroon-green">{t.settings}</h1>
      </header>

      <main aria-labelledby="settings-heading" className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-5 pb-32">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 flex items-center gap-4 bg-gradient-to-r from-medical-green/5 to-transparent">
            <div className="relative w-20 h-20 shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-cameroon-green/20" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-medical-green flex items-center justify-center text-white text-2xl font-black shadow-lg">
                  {user?.initials || '--'}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 id="settings-heading" className="text-lg font-bold text-slate-800 font-sans truncate">{name || user?.name || 'User'}</h2>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'Not signed in'}</p>
              <p className="text-xs font-bold text-cameroon-green mt-1">{user?.canUseClinicalTools ? (fr ? 'Accès clinique autorisé' : 'Clinical access authorized') : (fr ? 'Accès clinique non autorisé' : 'Clinical access not authorized')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 min-[420px]:grid-cols-4 gap-2 p-3 border-t border-slate-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-colors ${
                  activeTab === tab.id ? 'bg-cameroon-green text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'profile' && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div>
              <label htmlFor="profile-name" className="text-xs font-black uppercase tracking-wider text-slate-500">{fr ? 'Nom affiché' : 'Display name'}</label>
              <input
                id="profile-name"
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-cameroon-green"
              />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">{fr ? 'Autorisations professionnelles' : 'Professional authorization'}</h3>
              <dl className="mt-2 text-sm space-y-1"><div><dt className="inline font-bold">{fr ? 'Rôle vérifié : ' : 'Verified role: '}</dt><dd className="inline">{user?.canUseClinicalTools ? user.clinicalRole : (fr ? 'Non vérifié' : 'Not verified')}</dd></div><div><dt className="inline font-bold">{fr ? 'Organisation : ' : 'Organization: '}</dt><dd className="inline">{user?.canUseClinicalTools ? user.organizationId : '—'}</dd></div></dl>
              <p className="text-xs text-slate-600 mt-2">{fr ? 'Seul un administrateur autorisé peut accorder ou retirer un accès clinique. Modifier ce profil ne change pas vos permissions.' : 'Only an authorized administrator can grant or revoke clinical access. Editing this profile does not change your permissions.'}</p>
            </div>
            <div>
              <label htmlFor="profile-about" className="text-xs font-black uppercase tracking-wider text-slate-500">{fr ? 'Présentation' : 'About me'}</label>
              <textarea
                id="profile-about"
                maxLength={1000}
                value={about}
                onChange={(event) => setAbout(event.target.value)}
                rows={4}
                placeholder={fr ? 'Présentation professionnelle. Ne saisissez pas de données patient.' : 'Professional background. Do not enter patient data.'}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cameroon-green resize-none"
              />
            </div>
            <p className="text-sm text-slate-600">{fr ? 'Le contexte patient appartient à un dossier de consultation, pas au profil du professionnel.' : 'Patient context belongs to an encounter, not the professional’s profile.'}</p>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            {[
              ['Scan results', scanResults, setScanResults],
              ['Medication safety alerts', medicationAlerts, setMedicationAlerts],
              ['Product updates', productUpdates, setProductUpdates],
            ].map(([label, checked, setter]) => (
              <label key={String(label)} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4">
                <span className="text-sm font-bold text-slate-700">{String(label)}</span>
                <input
                  type="checkbox"
                  checked={Boolean(checked)}
                  onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)}
                  className="h-5 w-5 accent-cameroon-green"
                />
              </label>
            ))}
          </section>
        )}

        {activeTab === 'security' && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-cameroon-green/5 p-4">
              <ShieldIcon className="h-6 w-6 text-cameroon-green shrink-0" />
              <div>
                <h3 className="font-black text-slate-900">{fr ? 'Sécurité et confidentialité' : 'Account security and privacy'}</h3>
                <p className="text-sm text-slate-600 mt-1">{fr ? 'L’identité est vérifiée par Firebase. Les outils cliniques exigent une autorisation professionnelle et un consentement enregistrés côté serveur.' : 'Firebase verifies identity. Clinical tools require server-recorded professional authorization and consent.'}</p>
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm"><input type="checkbox" checked={analytics} disabled={accountBusy || !user?.uid} onChange={(event) => handleAnalytics(event.target.checked)} className="h-5 w-5 shrink-0" /><span>{fr ? 'Statistiques d’utilisation facultatives, sans contenu clinique. Désactivées par défaut ; aucun effet sur l’accès clinique.' : 'Optional usage analytics, without clinical content. Off by default; no effect on clinical access.'}</span></label>
            <p className="text-sm text-slate-600">{fr ? 'Le consentement clinique couvre le traitement demandé, le dossier et la sécurité. Son retrait bloque les nouveaux traitements sans effacer les données existantes. Les durées de conservation des journaux, sauvegardes et prestataires nécessitent encore une confirmation pour la production.' : 'Clinical consent covers requested processing, record storage and security. Withdrawal blocks new processing without erasing existing data. Retention periods for logs, backups and providers still require confirmation for production.'} <a href="/privacy.html" className="underline text-cameroon-green">{fr ? 'Politique de confidentialité' : 'Privacy policy'}</a></p>
            <div className="space-y-3">
              <button type="button" disabled={accountBusy || !user?.uid} onClick={handleExport} className="w-full py-3 rounded-xl bg-cameroon-green text-white font-bold disabled:opacity-50">{fr ? 'Exporter les données du compte (JSON)' : 'Export account data (JSON)'}</button>
              <button type="button" disabled={accountBusy || !user?.uid} onClick={handleWithdrawal} className="w-full py-3 rounded-xl border border-amber-400 text-amber-900 font-bold disabled:opacity-50">{fr ? 'Retirer le consentement clinique' : 'Withdraw clinical consent'}</button>
              <button type="button" disabled={accountBusy || !user?.uid} onClick={() => setConfirmDeletion(true)} className="w-full py-3 rounded-xl border border-red-200 text-red-700 font-bold disabled:opacity-50">{fr ? 'Demander la suppression du compte' : 'Request account deletion'}</button>
            </div>
            {confirmDeletion && <div className="rounded-xl border border-red-300 p-4 space-y-3"><p className="text-sm">{fr ? 'Cette action envoie une demande à examiner par un responsable. Elle ne supprime pas immédiatement les dossiers, journaux ou sauvegardes.' : 'This submits a request for a responsible person to review. It does not immediately delete records, logs or backups.'}</p><button type="button" disabled={accountBusy} onClick={handleDeletionRequest} className="font-bold text-red-700 underline">{fr ? 'Envoyer la demande' : 'Submit deletion request'}</button><button type="button" onClick={() => setConfirmDeletion(false)} className="ml-4 underline">{fr ? 'Annuler' : 'Cancel'}</button></div>}
            {accountBusy && <p role="status" className="text-sm">{fr ? 'Traitement…' : 'Working…'}</p>}
            {accountMessage && <p role="status" className="text-sm text-cameroon-green">{accountMessage}</p>}
            {accountError && <p role="alert" className="text-sm text-red-700">{accountError}</p>}
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Signed in as</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{user?.email || 'Not signed in'}</p>
            </div>
            <button onClick={handleLogout} className="w-full py-4 bg-white text-red-500 font-bold rounded-2xl border border-red-100 shadow-sm active:bg-red-50 transition-colors">
              {t.logout}
            </button>
          </section>
        )}

        {activeTab === 'about' && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertIcon className="h-6 w-6 text-cameroon-yellow-deep shrink-0" />
              <div>
                <h3 className="font-black text-slate-900">About CamDiag</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {fr ? 'CamDiag est un outil expérimental de revue de documents. Il ne pose pas de diagnostic, ne prescrit pas et ne remplace pas le jugement clinique.' : 'CamDiag is an investigational document-review tool. It does not diagnose, prescribe or replace clinical judgment.'}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              {fr ? 'Résultats cliniques en anglais ou français. Le mode Pidgin utilise l’anglais pour les résultats cliniques. Connexion internet requise pour OCR et IA.' : 'Clinical output is English or French. Pidgin mode uses English for clinical output. OCR and AI require internet access.'}
            </div>
          </section>
        )}

        {(activeTab === 'profile' || activeTab === 'notifications') && (
          <section className="space-y-2">
            <button
              onClick={handleSave}
              disabled={!user?.uid || saveStatus === 'saving'}
              className="w-full py-4 bg-cameroon-green text-white font-black rounded-2xl shadow-cameroon active:scale-[0.98] disabled:opacity-60"
            >
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save profile'}
            </button>
            {error && <p className="text-xs text-red-600 font-medium text-center">{error}</p>}
          </section>
        )}

        {activeTab !== 'security' && (
          <button onClick={handleLogout} className="w-full py-4 bg-white text-red-500 font-bold rounded-2xl border border-red-100 shadow-sm active:bg-red-50 transition-colors">
            {t.logout}
          </button>
        )}
      </main>

      <nav aria-label="Main navigation" className="glass-effect border-t border-slate-200 fixed bottom-0 left-0 right-0 px-2 sm:px-6 py-3 grid grid-cols-4 gap-1 mobile-bottom-nav z-20">
        <button onClick={() => navigate('/app')} className="min-w-0 flex flex-col items-center gap-1 text-slate-400">
          <HomeIcon /><span className="max-w-full truncate text-[10px] font-medium">{t.home}</span>
        </button>
        <button onClick={() => navigate('/patients')} className="min-w-0 flex flex-col items-center gap-1 text-slate-400">
          <UsersIcon /><span className="max-w-full truncate text-[10px] font-medium">{t.patients}</span>
        </button>
        <button onClick={() => navigate('/scanner')} className="min-w-0 flex flex-col items-center gap-1 text-slate-400">
          <div className="bg-slate-200 text-slate-600 p-1 rounded-lg"><CameraIcon /></div>
          <span className="max-w-full truncate text-[10px] font-medium">{t.scan}</span>
        </button>
        <button className="min-w-0 flex flex-col items-center gap-1 text-cameroon-green">
          <UserIcon />
          <span className="max-w-full truncate text-[10px] font-bold">{t.profile}</span>
        </button>
      </nav>
    </div>
  );
};

export default Settings;
