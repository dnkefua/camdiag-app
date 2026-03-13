import React from 'react';

const PatientRecords = ({ onBack, onNavigate, t }) => {
  const history = [
    { date: 'March 10, 2026', diagnosis: 'Dermatitis (Likely)', id: '8829', status: 'Analyzed', result: '92% Match' },
    { date: 'February 24, 2026', diagnosis: 'Cataract Check', id: '8814', status: 'Analyzed', result: 'Negative' },
    { date: 'January 15, 2026', diagnosis: 'Malaria RDT Scan', id: '8792', status: 'Positive', result: 'Stage 1' },
    { date: 'December 12, 2025', diagnosis: 'Respiratory Syncytial Virus', id: '8645', status: 'Analyzed', result: 'Needs follow-up' },
  ];

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="text-slate-600 p-1">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold text-cameroon-green">{t.patients}</h1>
      </header>

      <main className="p-5 space-y-6">
        {/* Active Stats Card */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t.active_users}</h3>
            <p className="text-3xl font-black text-cameroon-green mt-1">12,842</p>
            <p className="text-xs text-slate-400 mt-1">{t.total_active}</p>
          </div>
          <div className="bg-medical-green/10 p-4 rounded-full">
            <svg className="h-10 w-10 text-cameroon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </div>
        </section>

        {/* Diagnostic History */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">{t.history}</h3>
          <div className="space-y-3">
            {history.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group active:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800">{item.diagnosis}</h4>
                  <p className="text-xs text-slate-400">{item.date} • ID: {item.id}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === 'Positive' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {item.result}
                  </span>
                  <div className="mt-1">
                    <svg className="h-4 w-4 text-slate-300 ml-auto group-active:text-medical-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="glass-effect border-t border-slate-200 fixed bottom-0 left-0 right-0 px-6 py-3 flex justify-between safe-area-bottom z-20">
        <button onClick={() => onNavigate('hub')} className="flex flex-col items-center gap-1 text-slate-400">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a.999.999 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13zm7 7v-5h4v5h-4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          <span className="text-[10px] font-medium">{t.home}</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-cameroon-green">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          <span className="text-[10px] font-bold">{t.patients}</span>
        </button>
        <button onClick={() => onNavigate('scanner')} className="flex flex-col items-center gap-1 text-slate-400">
          <div className="bg-slate-200 text-slate-600 p-1 rounded-lg">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </div>
          <span className="text-[10px] font-medium">{t.scan}</span>
        </button>
        <button onClick={() => onNavigate('settings')} className="flex flex-col items-center gap-1 text-slate-400">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          <span className="text-[10px] font-medium">{t.profile}</span>
        </button>
      </nav>
    </div>
  );
};

export default PatientRecords;
