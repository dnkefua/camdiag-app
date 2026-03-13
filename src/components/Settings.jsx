import React from 'react';

const Settings = ({ onBack, onNavigate, t }) => {
  const menuItems = [
    { label: t.profile, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: t.notifications, icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11c0-2.206-1.794-4-4-4V6c0-1.103-.897-2-2-2s-2 .897-2 2v1c-2.206 0-4 1.794-4 4v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { label: t.security, icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { label: t.about, icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="text-slate-600 p-1">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold text-cameroon-green">{t.settings}</h1>
      </header>

      <main className="p-5 space-y-6">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 flex items-center gap-4 bg-gradient-to-r from-medical-green/5 to-transparent">
            <div className="w-16 h-16 rounded-full bg-medical-green flex items-center justify-center text-white text-2xl font-black shadow-lg">
              DK
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-sans">Dr. Kamga</h2>
              <p className="text-xs text-slate-500">kamga.doc@camdiag.cm</p>
            </div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {menuItems.map((item, idx) => (
              <button key={idx} className="w-full px-6 py-4 flex items-center justify-between active:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-slate-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                </div>
                <svg className="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                </svg>
              </button>
            ))}
          </div>
        </section>

        <button className="w-full py-4 bg-white text-red-500 font-bold rounded-2xl border border-red-50 shadow-sm active:bg-red-50 transition-colors">
          {t.logout}
        </button>
      </main>

      {/* Bottom Navigation */}
      <nav className="glass-effect border-t border-slate-200 fixed bottom-0 left-0 right-0 px-6 py-3 flex justify-between safe-area-bottom z-20">
        <button onClick={() => onNavigate('hub')} className="flex flex-col items-center gap-1 text-slate-400">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a.999.999 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13zm7 7v-5h4v5h-4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          <span className="text-[10px] font-medium">{t.home}</span>
        </button>
        <button onClick={() => onNavigate('patients')} className="flex flex-col items-center gap-1 text-slate-400">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          <span className="text-[10px] font-medium">{t.patients}</span>
        </button>
        <button onClick={() => onNavigate('scanner')} className="flex flex-col items-center gap-1 text-slate-400">
          <div className="bg-slate-200 text-slate-600 p-1 rounded-lg">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </div>
          <span className="text-[10px] font-medium">{t.scan}</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-cameroon-green">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[10px] font-bold">{t.profile}</span>
        </button>
      </nav>
    </div>
  );
};

export default Settings;
