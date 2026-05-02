import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { getPatientRecords } from '../services/firestore';
import type { FirestorePatientRecord } from '../services/firestore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { BackIcon, HomeIcon, UsersIcon, CameraIcon, UserIcon } from '../components/ui/Icons';

const PatientRecords = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { patientRecords, setPatientRecords } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    getPatientRecords(user.uid)
      .then((records) => {
        const mapped = records.map((r: FirestorePatientRecord) => ({
          id: r.id ?? '',
          date: r.date,
          diagnosis: r.diagnosis,
          status: r.status,
          result: r.result,
          category: r.category,
          bodyPart: r.bodyPart,
        }));
        setPatientRecords(mapped);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load records');
      })
      .finally(() => setIsLoading(false));
  }, [user?.uid, setPatientRecords]);

  return (
    <div className="bg-slate-50 text-slate-900 font-sans screen-safe flex flex-col pb-24">
      <a href="#patients-main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:text-medical-green focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-xl focus:font-bold">
        Skip to main content
      </a>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate('/app')} aria-label="Back" className="text-slate-600 p-1">
          <BackIcon />
        </button>
        <h1 className="text-xl font-bold text-cameroon-green">{t.patients}</h1>
      </header>

      <main aria-labelledby="patients-heading" className="p-4 sm:p-5 space-y-6">
        <h2 id="patients-heading" className="sr-only">{t.patients}</h2>
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t.active_users}</h3>
            <p className="text-3xl font-black text-cameroon-green mt-1">12,842</p>
            <p className="text-xs text-slate-400 mt-1">{t.total_active}</p>
          </div>
          <div className="bg-medical-green/10 p-4 rounded-full">
            <UsersIcon className="h-10 w-10 text-cameroon-green" />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">{t.history}</h3>
          <div className="space-y-3">
            {isLoading && user?.uid && (
              <LoadingSpinner size="md" message="Loading patient records..." />
            )}
            {loadError && !isLoading && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-center">
                <p className="text-sm text-red-600 font-medium">{loadError}</p>
                <button
                  onClick={() => {
                    if (!user?.uid) return;
                    setIsLoading(true);
                    setLoadError(null);
                    getPatientRecords(user.uid)
                      .then((records) => {
                        const mapped = records.map((r: FirestorePatientRecord) => ({
                          id: r.id ?? '',
                          date: r.date,
                          diagnosis: r.diagnosis,
                          status: r.status,
                          result: r.result,
                          category: r.category,
                          bodyPart: r.bodyPart,
                        }));
                        setPatientRecords(mapped);
                      })
                      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load records'))
                      .finally(() => setIsLoading(false));
                  }}
                  className="mt-2 text-xs font-bold text-red-700 underline"
                >
                  Try again
                </button>
              </div>
            )}
            {!isLoading && !loadError && patientRecords.length === 0 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-sm text-slate-500 font-medium">No patient records yet. Complete a scan to see results here.</p>
              </div>
            )}
            {!isLoading && patientRecords.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group active:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 leading-tight">{item.diagnosis}</h4>
                  <div className="flex flex-wrap gap-1 mt-1.5 mb-2">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{item.category}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded flex items-center gap-1">
                      <UsersIcon className="w-3 h-3 text-medical-green" />
                      {item.bodyPart}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">{item.date} &bull; ID: {item.id}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === 'Positive' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {item.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <nav aria-label="Main navigation" className="glass-effect border-t border-slate-200 fixed bottom-0 left-0 right-0 px-2 sm:px-6 py-3 grid grid-cols-4 gap-1 mobile-bottom-nav z-20">
        <button onClick={() => navigate('/app')} className="min-w-0 flex flex-col items-center gap-1 text-slate-400">
          <HomeIcon /><span className="max-w-full truncate text-[10px] font-medium">{t.home}</span>
        </button>
        <button className="min-w-0 flex flex-col items-center gap-1 text-cameroon-green">
          <UsersIcon /><span className="max-w-full truncate text-[10px] font-bold">{t.patients}</span>
        </button>
        <button onClick={() => navigate('/scanner')} className="min-w-0 flex flex-col items-center gap-1 text-slate-400">
          <div className="bg-slate-200 text-slate-600 p-1 rounded-lg"><CameraIcon /></div>
          <span className="max-w-full truncate text-[10px] font-medium">{t.scan}</span>
        </button>
        <button onClick={() => navigate('/settings')} className="min-w-0 flex flex-col items-center gap-1 text-slate-400">
          <UserIcon /><span className="max-w-full truncate text-[10px] font-medium">{t.profile}</span>
        </button>
      </nav>
    </div>
  );
};

export default PatientRecords;
