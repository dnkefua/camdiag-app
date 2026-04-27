import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { BackIcon, HomeIcon, PlusIcon, UsersIcon, MapPinIcon, ShareIcon, WarningIcon } from '../components/ui/Icons';

const NextSteps = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'clinics' | 'hospitals' | 'pharmacies' | 'telehealth'>('clinics');
  const [showMap, setShowMap] = useState(false);

  const facilityData = {
    clinics: [
      { name: 'City General Dermatology', distance: '1.2 km', rating: 4.8, type: 'Open' },
      { name: 'Hope Skin & Laser Center', distance: '2.5 km', rating: 4.5, type: 'Closes 5PM' },
      { name: 'Elite Care Specialists', distance: '3.1 km', rating: 4.9, type: 'Insurance' },
    ],
    hospitals: [
      { name: 'Yaound\u00e9 Central Hospital', distance: '4.5 km', rating: 4.2, type: '24/7' },
      { name: 'General Hospital Annex', distance: '5.8 km', rating: 4.0, type: '24/7' },
    ],
    pharmacies: [
      { name: 'MedPlus Pharmacy', distance: '0.8 km', rating: 4.7, type: 'Open' },
      { name: 'Green Cross Pharma', distance: '1.5 km', rating: 4.6, type: 'Open' },
    ],
    telehealth: [
      { name: 'Waspito Virtual Care', distance: 'Online', rating: 4.9, type: 'Instant' },
      { name: 'TeleMed Direct', distance: 'Online', rating: 4.4, type: 'On-demand' },
    ],
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="text-slate-600 p-1 active:scale-95 transition-transform">
            <BackIcon />
          </button>
          <h1 className="text-xl font-bold text-blue-900">{t.next_steps}</h1>
        </div>
        <button
          onClick={() => setShowMap(!showMap)}
          className={`px-4 py-1.5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${showMap ? 'bg-medical-green text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}
        >
          {showMap ? t.list : t.view_map}
        </button>
      </header>

      <main className="flex-grow p-4 space-y-6 max-w-lg mx-auto w-full">
        {showMap ? (
          <section className="space-y-4">
            <div className="bg-white p-2 rounded-[3.5rem] shadow-2xl border-4 border-white overflow-hidden relative aspect-[9/12]">
              <div className="absolute inset-0 bg-[#e5e3df]">
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-8 opacity-20 pointer-events-none">
                  {Array.from({ length: 48 }).map((_, i) => <div key={i} className="border-[0.5px] border-slate-400"></div>)}
                </div>

                <div className="absolute top-1/3 left-1/4 animate-bounce">
                  <MapPinIcon className="w-8 h-8 text-red-500 filter drop-shadow-md" />
                </div>
                <div className="absolute top-1/2 left-2/3 animate-pulse">
                  <MapPinIcon className="w-8 h-8 text-blue-500 filter drop-shadow-md" />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-medical-green/20 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-medical-green animate-ping"></div>
                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{t.map_radius}</p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white p-6 rounded-3xl shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold opacity-90">{t.scan_summary}</h2>
                  <p className="text-xs opacity-70">{t.scanned_time}</p>
                </div>
                <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase">ID: 8829</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10 shrink-0 flex items-center justify-center">
                    <ShareIcon className="text-white/60" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 font-medium">{t.primary_found}</p>
                    <h3 className="text-xl font-bold">Stage 1 Suspected</h3>
                  </div>
                </div>
                <button className="w-full bg-white text-blue-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg">
                  <ShareIcon />
                  {t.share_report}
                </button>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {(['clinics', 'hospitals', 'pharmacies', 'telehealth'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    {t[tab] || tab}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {facilityData[activeTab].map((facility, idx) => (
                  <article key={idx} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm active:bg-slate-50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {activeTab === 'telehealth' ? <UsersIcon className="h-6 w-6 text-blue-500" /> : <MapPinIcon className="w-6 h-6 text-red-400" />}
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">{facility.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">{facility.distance}</span>
                        <span className="text-[10px] font-black text-medical-green">&#9733; {facility.rating}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        <section className="mt-8 mb-6 p-6 rounded-2xl bg-red-50 border-2 border-red-200 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
            <WarningIcon />
          </div>
          <h4 className="text-red-800 font-bold text-lg mb-2 leading-tight">{t.disclaimer_title}</h4>
          <p className="text-red-700 font-semibold text-sm mb-4">{t.disclaimer_text}</p>
          <p className="text-red-600/80 text-xs leading-relaxed uppercase tracking-wider font-bold">{t.disclaimer_consult}</p>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-8 py-4 flex justify-between items-center z-30">
        <button onClick={() => navigate('/')} className="text-slate-400 active:scale-90 transition-transform"><HomeIcon /></button>
        <button onClick={() => navigate('/scanner')} className="bg-medical-green w-14 h-14 rounded-[1.5rem] shadow-xl shadow-medical-green/40 flex items-center justify-center text-white active:scale-95 transition-all -mt-12 border-4 border-slate-50">
          <PlusIcon />
        </button>
        <button onClick={() => navigate('/patients')} className="text-slate-400 active:scale-90 transition-transform"><UsersIcon /></button>
      </nav>
    </div>
  );
};

export default NextSteps;