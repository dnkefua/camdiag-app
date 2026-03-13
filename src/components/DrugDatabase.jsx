import React, { useState } from 'react';

const DrugDatabase = ({ onBack, onNavigate, t }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const drugs = [
    { name: 'Coartem (Artemether/Lumefantrine)', type: 'Antimalarial', dosage: '20mg/120mg', avail: 'High', description: 'First-line treatment for uncomplicated malaria in Cameroon.' },
    { name: 'Paracetamol (Efferalgan)', type: 'Analgesic', dosage: '500mg/1g', avail: 'High', description: 'Used for fever and pain relief.' },
    { name: 'Fansidar (Sulfadoxine/Pyrimethamine)', type: 'Antimalarial', dosage: '500mg/25mg', avail: 'Medium', description: 'Used for intermittent preventive treatment in pregnancy.' },
    { name: 'Amoxicillin', type: 'Antibiotic', dosage: '250mg/500mg', avail: 'High', description: 'Broad-spectrum antibiotic for bacterial infections.' },
    { name: 'Quinine Sulfate', type: 'Antimalarial', dosage: '300mg', avail: 'Medium', description: 'Used for severe malaria cases.' },
    { name: 'Ciprofloxacine', type: 'Antibiotic', dosage: '500mg', avail: 'High', description: 'Used for various bacterial infections.' },
    { name: 'Artemisia Annua (Herbal)', type: 'Natural', dosage: 'Tea/Leaves', avail: 'High', description: 'Traditional medicinal plant used locally for malaria support.' },
  ];

  const filteredDrugs = drugs.filter(drug => 
    drug.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    drug.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="text-slate-600 p-1">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold text-cameroon-green">{t.drugs}</h1>
      </header>

      <main className="p-5 space-y-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder={t.search}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-medical-green outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        </div>

        <div className="space-y-4">
          {filteredDrugs.map((drug, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800">{drug.name}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${drug.type === 'Natural' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {drug.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium italic">{drug.dosage} • {t.cameroon_avail}: {drug.avail}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{drug.description}</p>
            </div>
          ))}
        </div>
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
        <button onClick={() => onNavigate('settings')} className="flex flex-col items-center gap-1 text-slate-400">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          <span className="text-[10px] font-medium">{t.profile}</span>
        </button>
      </nav>
    </div>
  );
};

export default DrugDatabase;
