import React from 'react';

const DiagnosticHub = ({ onNewScan, onNavigate, t, language, setLanguage }) => {
  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-medical-green p-1.5 rounded-lg">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
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

      {/* Offline Status Bar */}
      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
        <span className="text-xs font-medium text-blue-700">Offline Mode Active — Scan results saved locally</span>
      </div>

      <main className="flex-grow p-5 space-y-8 overflow-y-auto">
        <section className="space-y-1">
          <p className="text-slate-500 font-medium">{t.hub_greeting}</p>
          <h2 className="text-2xl font-bold text-slate-800">{t.hub_title}</h2>
        </section>

        <section className="space-y-4">
          <button 
            onClick={onNewScan}
            className="w-full bg-gradient-to-br from-medical-green to-cameroon-green text-white rounded-3xl p-8 flex flex-col items-center justify-center gap-4 shadow-xl active:scale-95 transition-transform"
          >
            <div className="bg-white/20 p-4 rounded-full">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                <path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold block">{t.new_scan}</span>
              <span className="text-sm opacity-90">{t.ai_support}</span>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onNavigate('drugs')}
              className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
            >
              <svg className="h-6 w-6 text-medical-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span className="text-sm font-semibold text-slate-700">{t.drugs}</span>
            </button>
            <button 
              onClick={() => onNavigate('next')}
              className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
            >
              <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span className="text-sm font-semibold text-slate-700">{t.facilities}</span>
            </button>
            
            <button 
              onClick={() => onNavigate('blog')}
              className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
            >
              <svg className="h-6 w-6 text-medical-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2v-7m2 9v-7m-2 7H5m2-15h8m-8 4h8m-8 4h8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span className="text-sm font-semibold text-slate-700">{t.blog_title || 'Blog & News'}</span>
            </button>

            <button 
              onClick={() => onNavigate('comingup')}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-md active:scale-95 transition-transform"
            >
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <span className="text-sm font-bold text-white tracking-wide">{t.coming_up_title || 'Coming Up'}</span>
            </button>
          </div>
        </section>

        <section className="space-y-4 pb-20">
          <div className="flex justify-between items-end">
            <h3 className="text-lg font-bold text-slate-800">{t.recent}</h3>
            <button className="text-medical-blue text-sm font-semibold">{t.view_all}</button>
          </div>
          <div className="space-y-3">
            {[
              { id: 8829, title: language === 'en' ? 'Dermatitis (Likely)' : 'Dermatite (Probable)', date: 'Today, 10:45 AM', match: language === 'en' ? '92% Match' : '92% Concordance', type: 'green', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmcI05bjHEV2FULOl2G_XdUT-Bo5evsf69N08o67PkzCI2RxqgTxTHrLt0ldhhdIIlHFTtudmJ0Nuz9FRSWBhOGHFX6WXKwEqUNyUHM6YTgaN9wPPleGZWSsML4ks6VaR2CgubNYAb4mRJM0GeJx5GTpk9ua_KStCLURanx0tcLw_uIopXnY2MrILiWfVNo6J26WV3c72YfF3XfAK5_cAAs0qZJsfQGthqEoeavGkC07h7tjWv36E6OPMSDYy3oWhrSa1rS7dZhWgn' },
              { id: 8814, title: language === 'en' ? 'Cataract Check' : 'Contrôle de Cataracte', date: 'Yesterday, 4:20 PM', match: language === 'en' ? 'Analyzed' : 'Analysé', type: 'slate', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmh64eK5_WGVvQldM_Y1vButtSuFI8hy68Ihx3nMdhZ41A7iqKZZIUbUedmL5B-sofZhDFE-LtstQhPVleXVZS_8KknS1q27R2z8YHrCHDXu9oiti_0dufyLgYVQ4W-hknNT9guEzHceSkCQ5jrUNBHVLFcIdja6_PMS_x6tkRvHLsckT3bi8MdG-wxqHU75Wg451bYZdLp1TRVtnDNLvDroEnEFR89Uyjkz5lrL2PSeupQer8riskIkklMugkhUSNM3c6EctXIdBt' },
              { id: 8792, title: language === 'en' ? 'Malaria RDT Scan' : 'Test Rapide Paludisme', date: 'Oct 24, 2023', match: language === 'en' ? 'Positive' : 'Positif', type: 'red', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3ujuc_PRG6YAuFiGA4R26i1H7v5-pA_vUBm2KYbf-nuvbfzOnZuMoFqwL5mD4GluoTnAgjnmRTqDNlwVamZ5E6N_tgRxWxzatycg2OULNIb6UTWOZGRl1nmw7JGLuaL8SbNu0ZKI4F4TOkoB3xpOU-Qo1XUqVEOEVb0Co2UDIRSGbeWvz_mt29ssG76iellWkfvgh5jyFJkG-LJ1O0Yz_pk9cARsEjiL_KyPbedBIVYkZkFZ6tqtX9ypjvDgFUoBbNQf6IiXu8tFz' }
            ].map(item => (
              <article key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
                <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center`}>
                  <img alt="Scan preview" className="rounded-lg object-cover w-full h-full" src={item.img} />
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-slate-800">{item.title}</h4>
                  <p className="text-xs text-slate-500">{item.date} • ID: {item.id}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase`}>{item.match}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="glass-effect border-t border-slate-200 fixed bottom-0 left-0 right-0 px-6 py-3 flex justify-between safe-area-bottom">
        <button onClick={() => onNavigate('hub')} className="flex flex-col items-center gap-1 text-cameroon-green">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a.999.999 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13zm7 7v-5h4v5h-4z"></path>
          </svg>
          <span className="text-[10px] font-bold">{t.home}</span>
        </button>
        <button onClick={() => onNavigate('patients')} className="flex flex-col items-center gap-1 text-slate-400">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span className="text-[10px] font-medium">{t.patients}</span>
        </button>
        <button onClick={() => onNavigate('settings')} className="flex flex-col items-center gap-1 text-slate-400">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span className="text-[10px] font-medium">{t.settings}</span>
        </button>
      </nav>
    </div>
  );
};

export default DiagnosticHub;
