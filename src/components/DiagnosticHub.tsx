import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { ShieldIcon, CameraIcon, ClipBoardIcon, LocationIcon, BlogIcon, BoltIcon, HomeIcon, UsersIcon, SettingsIcon } from '../components/ui/Icons';

const DiagnosticHub = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useTranslation();
  const isOnline = useOnlineStatus();

  const recentScans = [
    { id: 8829, title: language === 'en' ? 'Dermatitis (Likely)' : 'Dermatite (Probable)', date: 'Today, 10:45 AM', match: language === 'en' ? '92% Match' : '92% Concordance' },
    { id: 8814, title: language === 'en' ? 'Cataract Check' : 'Contrôle de Cataracte', date: 'Yesterday, 4:20 PM', match: language === 'en' ? 'Analyzed' : 'Analysé' },
    { id: 8792, title: language === 'en' ? 'Malaria RDT Scan' : 'Test Rapide Paludisme', date: 'Oct 24, 2023', match: language === 'en' ? 'Positive' : 'Positif' },
  ];

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <motion.div key="hub" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
      <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-medical-green p-1.5 rounded-lg">
              <ShieldIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-cameroon-green tracking-tight">CamDiag</h1>
          </div>
          <div className="flex bg-slate-100 rounded-full p-1 text-xs font-semibold shadow-inner">
            <button
              onClick={() => setLanguage('en')}
              className={`${language === 'en' ? 'bg-white text-cameroon-green' : 'text-slate-500'} px-3 py-1 rounded-full shadow-sm transition-all`}
            >EN</button>
            <button
              onClick={() => setLanguage('fr')}
              className={`${language === 'fr' ? 'bg-white text-cameroon-green' : 'text-slate-500'} px-3 py-1 rounded-full shadow-sm transition-all`}
            >FR</button>
            <button className="px-3 py-1 text-slate-500">Local</button>
          </div>
        </header>

        {!isOnline && (
          <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-xs font-medium text-blue-700">{t.offline_mode}</span>
          </div>
        )}

        <main className="flex-grow p-5 space-y-8 overflow-y-auto">
          <section className="space-y-1">
            <p className="text-slate-500 font-medium">{t.hub_greeting}</p>
            <h2 className="text-2xl font-bold text-slate-800">{t.hub_title}</h2>
          </section>

          <section className="space-y-4">
            <button
              onClick={() => navigate('/scanner')}
              className="w-full bg-gradient-to-br from-medical-green to-cameroon-green text-white rounded-3xl p-8 flex flex-col items-center justify-center gap-4 shadow-xl active:scale-95 transition-transform"
            >
              <div className="bg-white/20 p-4 rounded-full">
                <CameraIcon className="h-12 w-12" />
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold block">{t.new_scan}</span>
                <span className="text-sm opacity-90">{t.ai_support}</span>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/drugs')}
                className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
              >
                <ClipBoardIcon className="h-6 w-6 text-medical-blue" />
                <span className="text-sm font-semibold text-slate-700">{t.drugs}</span>
              </button>
              <button
                onClick={() => navigate('/next-steps')}
                className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
              >
                <LocationIcon className="h-6 w-6 text-orange-500" />
                <span className="text-sm font-semibold text-slate-700">{t.facilities}</span>
              </button>

              <button
                onClick={() => navigate('/blog')}
                className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
              >
                <BlogIcon className="h-6 w-6 text-medical-green" />
                <span className="text-sm font-semibold text-slate-700">{t.blog_title}</span>
              </button>

              <button
                onClick={() => navigate('/coming-up')}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-md active:scale-95 transition-transform"
              >
                <BoltIcon className="h-6 w-6 text-white" />
                <span className="text-sm font-bold text-white tracking-wide">{t.coming_up_title}</span>
              </button>
            </div>
          </section>

          <section className="space-y-4 pb-20">
            <div className="flex justify-between items-end">
              <h3 className="text-lg font-bold text-slate-800">{t.recent}</h3>
              <button className="text-medical-blue text-sm font-semibold">{t.view_all}</button>
            </div>
            <div className="space-y-3">
              {recentScans.map((item) => (
                <article key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <CameraIcon className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-slate-800">{item.title}</h4>
                    <p className="text-xs text-slate-500">{item.date} &bull; ID: {item.id}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">{item.match}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>

        <nav className="glass-effect border-t border-slate-200 fixed bottom-0 left-0 right-0 px-6 py-3 flex justify-between safe-area-bottom">
          <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 text-cameroon-green">
            <HomeIcon />
            <span className="text-[10px] font-bold">{t.home}</span>
          </button>
          <button onClick={() => navigate('/patients')} className="flex flex-col items-center gap-1 text-slate-400">
            <UsersIcon />
            <span className="text-[10px] font-medium">{t.patients}</span>
          </button>
          <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-1 text-slate-400">
            <SettingsIcon />
            <span className="text-[10px] font-medium">{t.settings}</span>
          </button>
        </nav>
      </div>
    </motion.div>
  );
};

export default DiagnosticHub;