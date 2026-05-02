import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { updateUserProfile } from '../services/firestore';
import { BackIcon, HomeIcon, UsersIcon, CameraIcon, UserIcon, ShieldIcon, AlertIcon } from '../components/ui/Icons';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'about';

const readImageAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const maxSize = 420;
      const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Could not process image.'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => reject(new Error('Could not read image.'));
    image.src = String(reader.result);
  };
  reader.onerror = () => reject(new Error('Could not read image.'));
  reader.readAsDataURL(file);
});

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'patient');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [about, setAbout] = useState(user?.about || '');
  const [symptoms, setSymptoms] = useState(user?.symptoms || '');
  const [scanResults, setScanResults] = useState(user?.notificationPrefs?.scanResults ?? true);
  const [medicationAlerts, setMedicationAlerts] = useState(user?.notificationPrefs?.medicationAlerts ?? true);
  const [productUpdates, setProductUpdates] = useState(user?.notificationPrefs?.productUpdates ?? false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name || '');
    setRole(user?.role || 'patient');
    setPhotoUrl(user?.photoUrl || '');
    setAbout(user?.about || '');
    setSymptoms(user?.symptoms || '');
    setScanResults(user?.notificationPrefs?.scanResults ?? true);
    setMedicationAlerts(user?.notificationPrefs?.medicationAlerts ?? true);
    setProductUpdates(user?.notificationPrefs?.productUpdates ?? false);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    void navigate('/app');
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setPhotoUrl(await readImageAsDataUrl(file));
      setSaveStatus('idle');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload profile photo.');
      setSaveStatus('error');
    } finally {
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!user?.uid || saveStatus === 'saving') return;
    setSaveStatus('saving');
    setError(null);

    try {
      await updateUserProfile(user.uid, {
        name: name.trim() || user.name,
        role,
        photoUrl,
        about,
        symptoms,
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
              <label className="absolute -bottom-1 -right-1 bg-cameroon-yellow text-cameroon-night rounded-full px-2 py-1 text-[10px] font-black shadow cursor-pointer">
                Edit
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            <div className="min-w-0">
              <h2 id="settings-heading" className="text-lg font-bold text-slate-800 font-sans truncate">{name || user?.name || 'User'}</h2>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'Not signed in'}</p>
              <p className="text-[10px] uppercase tracking-widest font-black text-cameroon-green mt-1">{role}</p>
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
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">Display name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-cameroon-green"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">Role</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-cameroon-green bg-white"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">About me</label>
              <textarea
                value={about}
                onChange={(event) => setAbout(event.target.value)}
                rows={4}
                placeholder="Brief clinical background, care role, location, or notes."
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cameroon-green resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">My symptoms</label>
              <textarea
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                rows={4}
                placeholder="Current symptoms, allergies, medications, or ongoing concerns."
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cameroon-green resize-none"
              />
            </div>
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
                <h3 className="font-black text-slate-900">Account security</h3>
                <p className="text-sm text-slate-600 mt-1">Google/Firebase authentication protects sign-in. Patient records and profile data are restricted to your account.</p>
              </div>
            </div>
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
                  CamDiag provides AI-assisted clinical decision support for medical documents, lab tests, and scan workflows. It is not a diagnosis and all results require professional review.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Built by NDN Analytics for practical healthcare support, secure testing, and fast field workflows.
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
