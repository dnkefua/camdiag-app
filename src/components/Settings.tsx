import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { BackIcon, HomeIcon, UsersIcon, CameraIcon, ChevronRightIcon } from '../components/ui/Icons';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const menuItems = [
    { label: t.profile, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: t.notifications, icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11c0-2.206-1.794-4-4-4V6c0-1.103-.897-2-2-2s-2 .897-2 2v1c-2.206 0-4 1.794-4 4v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { label: t.security, icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { label: t.about, icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/app');
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate('/app')} aria-label="Back" className="text-slate-600 p-1">
          <BackIcon />
        </button>
        <h1 className="text-xl font-bold text-cameroon-green">{t.settings}</h1>
      </header>

      <main aria-labelledby="settings-heading" className="p-5 space-y-6">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 flex items-center gap-4 bg-gradient-to-r from-medical-green/5 to-transparent">
            <div className="w-16 h-16 rounded-full bg-medical-green flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {user?.initials || 'DK'}
            </div>
            <div>
              <h2 id="settings-heading" className="text-lg font-bold text-slate-800 font-sans">{user?.name || 'Dr. Kamga'}</h2>
              <p className="text-xs text-slate-500">{user?.email || 'kamga.doc@camdiag.cm'}</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {menuItems.map((item, idx) => (
              <button key={idx} className="w-full px-6 py-4 flex items-center justify-between active:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-slate-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                </div>
                <ChevronRightIcon />
              </button>
            ))}
          </div>
        </section>

        <button onClick={handleLogout} className="w-full py-4 bg-white text-red-500 font-bold rounded-2xl border border-red-50 shadow-sm active:bg-red-50 transition-colors">
          {t.logout}
        </button>
      </main>

      <nav aria-label="Main navigation" className="glass-effect border-t border-slate-200 fixed bottom-0 left-0 right-0 px-6 py-3 flex justify-between safe-area-bottom z-20">
        <button onClick={() => navigate('/app')} className="flex flex-col items-center gap-1 text-slate-400">
          <HomeIcon /><span className="text-[10px] font-medium">{t.home}</span>
        </button>
        <button onClick={() => navigate('/patients')} className="flex flex-col items-center gap-1 text-slate-400">
          <UsersIcon /><span className="text-[10px] font-medium">{t.patients}</span>
        </button>
        <button onClick={() => navigate('/scanner')} className="flex flex-col items-center gap-1 text-slate-400">
          <div className="bg-slate-200 text-slate-600 p-1 rounded-lg"><CameraIcon /></div>
          <span className="text-[10px] font-medium">{t.scan}</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-cameroon-green">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-[10px] font-bold">{t.profile}</span>
        </button>
      </nav>
    </div>
  );
};

export default Settings;