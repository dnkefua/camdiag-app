import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { listEncounters } from '../services/medgemma';
import { getSensitiveSessionSignal } from '../services/session';
import type { ClinicalEncounter } from '../types';
import { CamDiagLogo } from '../components/ui/CamDiagLogo';
import {
  CameraIcon,
  ClipBoardIcon,
  LocationIcon,
  BlogIcon,
  BoltIcon,
  HomeIcon,
  UsersIcon,
  SettingsIcon,
} from '../components/ui/Icons';

const DiagnosticHubScreen = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useTranslation();
  const isOnline = useOnlineStatus();
  const { user } = useAuth();
  const { setActiveEncounter, setActiveJob, resetAnalysis } = useAppStore();
  const [savedScans, setSavedScans] = useState<ClinicalEncounter[]>([]);
  const [historyLoading, setHistoryLoading] = useState(Boolean(user?.canUseClinicalTools));
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const session = getSensitiveSessionSignal();
    const clear = () => {
      controller.abort();
      setSavedScans([]);
      setHistoryLoading(false);
    };
    session.addEventListener('abort', clear, { once: true });
    if (user?.canUseClinicalTools)
      listEncounters(undefined, controller.signal)
        .then((page) => {
          if (!controller.signal.aborted) setSavedScans(page.items);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setHistoryError('Could not load saved encounters. Open patient records to retry.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setHistoryLoading(false);
        });
    return () => {
      controller.abort();
      session.removeEventListener('abort', clear);
    };
  }, [user?.uid, user?.canUseClinicalTools]);

  const recentScans = savedScans;
  const visibleScans = showAllResults ? recentScans : recentScans.slice(0, 3);

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <motion.div
      key="hub"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="h-[100svh] h-[100dvh] overflow-hidden"
    >
      <div className="bg-cameroon-ivory text-cameroon-night font-sans flex h-full min-h-0 flex-col overflow-hidden">
        {/* Cameroon flag accent strip */}
        <div className="h-1 bg-cameroon-flag" />

        <header className="bg-white/90 backdrop-blur-md border-b border-cameroon-green/10 z-10 px-4 py-3 flex justify-between items-center shadow-sm shrink-0 safe-area-top">
          <CamDiagLogo size={36} showWordmark />
          <div className="flex bg-cameroon-green/8 rounded-full p-1 text-xs font-bold shadow-inner border border-cameroon-green/15">
            {(['en', 'fr', 'pcm'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 rounded-full transition-all ${
                  language === lang
                    ? 'bg-cameroon-green text-white shadow-cameroon'
                    : 'text-cameroon-green/70 hover:text-cameroon-green-deep'
                }`}
              >
                {lang === 'pcm' ? 'Local' : lang.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {!isOnline && (
          <div className="bg-cameroon-yellow/15 px-4 py-2 border-b border-cameroon-yellow/30 flex items-center justify-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-cameroon-yellow-deep animate-pulse" />
            <span className="text-xs font-bold text-cameroon-yellow-deep">{t.offline_mode}</span>
          </div>
        )}

        <main
          aria-labelledby="hub-heading"
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4 sm:p-5 space-y-6 sm:space-y-8 pb-32"
        >
          <section className="space-y-1">
            <p className="text-cameroon-green/70 font-semibold uppercase tracking-wider text-xs">
              {t.hub_greeting}
            </p>
            <h2 id="hub-heading" className="text-3xl font-black text-cameroon-night font-display">
              {t.hub_title}
            </h2>
          </section>

          <section className="space-y-4">
            <motion.button
              onClick={() => {
                resetAnalysis();
                setActiveEncounter(null);
                setActiveJob(null);
                void navigate('/scanner');
              }}
              type="button"
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-jungle text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-4 shadow-premium relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-cameroon-yellow/25 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-cameroon-red/20 blur-2xl" />
              <div className="relative bg-white/15 backdrop-blur-sm p-4 rounded-full border border-cameroon-yellow/30">
                <CameraIcon className="h-12 w-12" />
              </div>
              <div className="text-center relative">
                <span className="text-2xl font-black block">{t.new_scan}</span>
                <span className="text-sm opacity-90 font-medium">{t.ai_support}</span>
              </div>
            </motion.button>

            <div className="grid grid-cols-2 gap-3 min-[380px]:gap-4">
              {[
                {
                  onClick: () => navigate('/drugs'),
                  icon: <ClipBoardIcon className="h-6 w-6" />,
                  label: t.drugs,
                  accent: 'text-cameroon-green bg-cameroon-green/8 border-cameroon-green/20',
                },
                {
                  onClick: () => navigate('/next-steps'),
                  icon: <LocationIcon className="h-6 w-6" />,
                  label: t.facilities,
                  accent: 'text-cameroon-red bg-cameroon-red/8 border-cameroon-red/20',
                },
                {
                  onClick: () => navigate('/blog'),
                  icon: <BlogIcon className="h-6 w-6" />,
                  label: t.blog_title,
                  accent:
                    'text-cameroon-yellow-deep bg-cameroon-yellow/15 border-cameroon-yellow/30',
                },
                {
                  onClick: () => navigate('/coming-up'),
                  icon: <BoltIcon className="h-6 w-6 text-white" />,
                  label: t.coming_up_title,
                  accent: 'text-white bg-sunset border-cameroon-yellow/40 shadow-sunset-glow',
                  isPremium: true,
                },
              ].map((tile) => (
                <motion.button
                  key={tile.label}
                  type="button"
                  onClick={tile.onClick}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  className={`min-w-0 p-3 min-[380px]:p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm border-2 transition-all ${tile.accent}`}
                >
                  {tile.icon}
                  <span
                    className={`text-center text-xs min-[380px]:text-sm leading-tight font-black tracking-wide break-words ${tile.isPremium ? 'text-white' : ''}`}
                  >
                    {tile.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </section>

          <section className="space-y-4 pb-20">
            <div className="flex justify-between items-end">
              <h3 className="text-lg font-black text-cameroon-night">{t.recent}</h3>
              {recentScans.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllResults((current) => !current)}
                  className="text-cameroon-green text-sm font-black uppercase tracking-wider"
                >
                  {showAllResults ? 'Show less' : t.view_all}
                </button>
              )}
            </div>
            <div className="space-y-3">
              {historyLoading && recentScans.length === 0 && (
                <p className="rounded-xl border border-cameroon-green/10 bg-white p-4 text-sm font-semibold text-slate-500">
                  Loading recent results...
                </p>
              )}
              {historyError && recentScans.length === 0 && (
                <p
                  role="alert"
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800"
                >
                  {historyError}
                </p>
              )}
              {!historyLoading && !historyError && recentScans.length === 0 && (
                <p className="rounded-xl border border-cameroon-green/10 bg-white p-4 text-sm font-semibold text-slate-500">
                  No analyses yet. Your completed reports will appear here.
                </p>
              )}
              {visibleScans.map((item, i) => (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveEncounter(item);
                    setActiveJob(null);
                    resetAnalysis();
                    void navigate(item.latestAnalysisId ? '/analysis' : '/patients');
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="w-full bg-white p-4 rounded-2xl border border-cameroon-green/10 flex items-center gap-3 min-[380px]:gap-4 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:cursor-default"
                >
                  <div className="w-12 h-12 rounded-xl bg-cameroon-green/10 flex shrink-0 items-center justify-center">
                    <CameraIcon className="h-6 w-6 text-cameroon-green" />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <h4 className="font-black text-cameroon-night leading-tight">
                      {item.patientId}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {new Date(item.createdAt).toLocaleString()} &bull;{' '}
                      {item.documentType.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="inline-block shrink-0 px-2 py-1 rounded-full bg-cameroon-green/10 text-cameroon-green-deep text-[9px] min-[380px]:text-[10px] font-black uppercase tracking-wider">
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </motion.button>
              ))}
            </div>
          </section>
        </main>

        <nav
          aria-label="Main navigation"
          className="glass-effect border-t border-cameroon-green/10 fixed bottom-0 left-0 right-0 px-5 sm:px-6 py-3 flex justify-between mobile-bottom-nav z-30"
        >
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="flex flex-col items-center gap-1 text-cameroon-green"
          >
            <HomeIcon />
            <span className="text-[10px] font-black uppercase tracking-wider">{t.home}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="flex flex-col items-center gap-1 text-cameroon-green/40"
          >
            <UsersIcon />
            <span className="text-[10px] font-bold">{t.patients}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center gap-1 text-cameroon-green/40"
          >
            <SettingsIcon />
            <span className="text-[10px] font-bold">{t.settings}</span>
          </button>
        </nav>
      </div>
    </motion.div>
  );
};

const DiagnosticHub = () => {
  const { user } = useAuth();
  return <DiagnosticHubScreen key={user?.uid ?? 'signed-out'} />;
};
export default DiagnosticHub;
