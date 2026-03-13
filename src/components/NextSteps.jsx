import React, { useState } from 'react';

const NextSteps = ({ onHome, onScan, onNavigate, t }) => {
  const [activeTab, setActiveTab] = useState('clinics');
  const [showMap, setShowMap] = useState(false);

  const facilityData = {
    clinics: [
      { name: 'City General Dermatology', distance: '1.2 km', rating: 4.8, type: 'Open', color: 'green', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100&h=100&fit=crop' },
      { name: 'Hope Skin & Laser Center', distance: '2.5 km', rating: 4.5, type: 'Closes 5PM', color: 'slate', img: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=100&h=100&fit=crop' },
      { name: 'Elite Care Specialists', distance: '3.1 km', rating: 4.9, type: 'Insurance', color: 'blue', img: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=100&h=100&fit=crop' }
    ],
    hospitals: [
      { name: 'Yaoundé Central Hospital', distance: '4.5 km', rating: 4.2, type: '24/7', color: 'red', img: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=100&h=100&fit=crop' },
      { name: 'General Hospital Annex', distance: '5.8 km', rating: 4.0, type: '24/7', color: 'red', img: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=100&h=100&fit=crop' }
    ],
    pharmacies: [
      { name: 'MedPlus Pharmacy', distance: '0.8 km', rating: 4.7, type: 'Open', color: 'green', img: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=100&h=100&fit=crop' },
      { name: 'Green Cross Pharma', distance: '1.5 km', rating: 4.6, type: 'Open', color: 'green', img: 'https://images.unsplash.com/photo-1576602976047-174ef57a4645?w=100&h=100&fit=crop' }
    ],
    telehealth: [
      { name: 'Waspito Virtual Care', distance: 'Online', rating: 4.9, type: 'Instant', color: 'blue', img: 'https://images.unsplash.com/photo-1576091160550-2173599211d0?w=100&h=100&fit=crop' },
      { name: 'TeleMed Direct', distance: 'Online', rating: 4.4, type: 'On-demand', color: 'blue', img: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=100&h=100&fit=crop' }
    ]
  };

  const currentFacilities = facilityData[activeTab] || [];

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={onHome} className="text-slate-600 p-1 active:scale-95 transition-transform">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </button>
          <h1 className="text-xl font-bold text-blue-900">{t.next_steps}</h1>
        </div>
        <button 
          onClick={() => setShowMap(!showMap)}
          className={`px-4 py-1.5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${showMap ? 'bg-medical-green text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}
        >
          {showMap ? 'List' : t.view_map.split(' ')[1]}
        </button>
      </header>

      <main className="flex-grow p-4 space-y-6 max-w-lg mx-auto w-full">
        {showMap ? (
          <section className="space-y-4">
            <div className="bg-white p-2 rounded-[3.5rem] shadow-2xl border-4 border-white overflow-hidden relative aspect-[9/12]">
              <div className="absolute inset-0 bg-[#e5e3df]">
                <img src="https://lh3.googleusercontent.com/aida-public/AG8mX67oF3x8_4119P_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1" className="w-full h-full object-cover opacity-60 grayscale-[0.5]" alt="Map" />
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-8 opacity-20 pointer-events-none">
                  {[...Array(48)].map((_, i) => <div key={i} className="border-[0.5px] border-slate-400"></div>)}
                </div>
                
                {/* Map Markers */}
                <div className="absolute top-1/3 left-1/4 animate-bounce">
                  <svg className="w-8 h-8 text-red-500 filter drop-shadow-md" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.0505a7.071 7.071 0 119.9 9.9L10 18.9l-4.95-4.95a7.071 7.071 0 010-9.9z" clipRule="evenodd" /></svg>
                </div>
                <div className="absolute top-1/2 left-2/3 animate-pulse">
                  <svg className="w-8 h-8 text-blue-500 filter drop-shadow-md" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.0505a7.071 7.071 0 119.9 9.9L10 18.9l-4.95-4.95a7.071 7.071 0 010-9.9z" clipRule="evenodd" /></svg>
                </div>

                {/* Radius Alert */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-medical-green/20 flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-medical-green animate-ping"></div>
                   <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{t.map_radius}</p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Scan Summary Card */}
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
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10 shrink-0">
                    <img alt="Scan" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmcI05bjHEV2FULOl2G_XdUT-Bo5evsf69N08o67PkzCI2RxqgTxTHrLt0ldhhdIIlHFTtudmJ0Nuz9FRSWBhOGHFX6WXKwEqUNyUHM6YTgaN9wPPleGZWSsML4ks6VaR2CgubNYAb4mRJM0GeJx5GTpk9ua_KStCLURanx0tcLw_uIopXnY2MrILiWfVNo6J26WV3c72YfF3XfAK5_cAAs0qZJsfQGthqEoeavGkC07h7tjWv36E6OPMSDYy3oWhrSa1rS7dZhWgn" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 font-medium">{t.primary_found}</p>
                    <h3 className="text-xl font-bold">Stage 1 Suspected</h3>
                  </div>
                </div>
                <button className="w-full bg-white text-blue-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                  {t.share_report}
                </button>
              </div>
            </section>

            {/* Nearby Facilities with Tabs */}
            <section className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['clinics', 'hospitals', 'pharmacies', 'telehealth'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      activeTab === tab 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    {t[tab] || tab}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {facilityData[activeTab].map((facility, idx) => (
                  <article key={idx} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm active:bg-slate-50 transition-colors">
                    <img alt={facility.name} className="w-12 h-12 rounded-xl object-cover bg-slate-100" src={facility.img} />
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">{facility.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">{facility.distance}</span>
                        <span className="text-[10px] font-black text-medical-green">★ {facility.rating}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Medical Disclaimer Section */}
        <section className="mt-8 mb-6 p-6 rounded-2xl bg-red-50 border-2 border-red-200 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
          </div>
          <h4 className="text-red-800 font-bold text-lg mb-2 leading-tight">{t.disclaimer_title}</h4>
          <p className="text-red-700 font-semibold text-sm mb-4">{t.disclaimer_text}</p>
          <p className="text-red-600/80 text-xs leading-relaxed uppercase tracking-wider font-bold">{t.disclaimer_consult}</p>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-8 py-4 flex justify-between items-center z-30">
        <button onClick={onHome} className="text-slate-400 active:scale-90 transition-transform"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></button>
        <button onClick={onScan} className="bg-medical-green w-14 h-14 rounded-[1.5rem] shadow-xl shadow-medical-green/40 flex items-center justify-center text-white active:scale-95 transition-all -mt-12 border-4 border-slate-50">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path></svg>
        </button>
        <button onClick={() => onNavigate('patients')} className="text-slate-400 active:scale-90 transition-transform"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg></button>
      </nav>
    </div>
  );
};

export default NextSteps;
