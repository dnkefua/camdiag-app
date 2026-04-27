import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { FacilityMap, type MappedFacility } from './ui/FacilityMap';
import { BackIcon, HomeIcon, PlusIcon, UsersIcon, MapPinIcon, ShareIcon, WarningIcon } from '../components/ui/Icons';

type Tab = 'clinics' | 'hospitals' | 'pharmacies' | 'telehealth';

interface FacilityRecord {
  name: string;
  distance: string;
  rating: number;
  type: string;
  position?: { lat: number; lng: number };
  category: MappedFacility['category'];
  address?: string;
}

const NextSteps = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('clinics');
  const [showMap, setShowMap] = useState(false);

  // Real Yaoundé / Douala-area coords for demo facilities. Once Firestore
  // facilities collection has lat/lng, swap this static map out.
  const facilityData: Record<Tab, FacilityRecord[]> = {
    clinics: [
      { name: 'City General Dermatology', distance: '1.2 km', rating: 4.8, type: 'Open',
        category: 'clinic', position: { lat: 3.866, lng: 11.519 }, address: 'Bastos, Yaoundé' },
      { name: 'Hope Skin & Laser Center', distance: '2.5 km', rating: 4.5, type: 'Closes 5PM',
        category: 'clinic', position: { lat: 3.852, lng: 11.504 }, address: 'Centre-ville, Yaoundé' },
      { name: 'Elite Care Specialists', distance: '3.1 km', rating: 4.9, type: 'Insurance',
        category: 'clinic', position: { lat: 3.879, lng: 11.498 }, address: 'Mvan, Yaoundé' },
    ],
    hospitals: [
      { name: 'Yaoundé Central Hospital', distance: '4.5 km', rating: 4.2, type: '24/7',
        category: 'hospital', position: { lat: 3.864, lng: 11.521 }, address: 'Avenue Henri Dunant' },
      { name: 'General Hospital Annex', distance: '5.8 km', rating: 4.0, type: '24/7',
        category: 'hospital', position: { lat: 3.892, lng: 11.541 }, address: 'Ngousso, Yaoundé' },
    ],
    pharmacies: [
      { name: 'MedPlus Pharmacy', distance: '0.8 km', rating: 4.7, type: 'Open',
        category: 'pharmacy', position: { lat: 3.857, lng: 11.512 } },
      { name: 'Green Cross Pharma', distance: '1.5 km', rating: 4.6, type: 'Open',
        category: 'pharmacy', position: { lat: 3.842, lng: 11.515 } },
    ],
    telehealth: [
      { name: 'Waspito Virtual Care', distance: 'Online', rating: 4.9, type: 'Instant',
        category: 'telehealth', position: { lat: 3.848, lng: 11.502 } },
      { name: 'TeleMed Direct', distance: 'Online', rating: 4.4, type: 'On-demand',
        category: 'telehealth', position: { lat: 3.848, lng: 11.502 } },
    ],
  };

  const allMappedFacilities = useMemo<MappedFacility[]>(() => {
    return (Object.keys(facilityData) as Tab[]).flatMap((key) =>
      facilityData[key]
        .filter((f) => f.position)
        .map((f) => ({
          name: f.name,
          rating: f.rating,
          category: f.category,
          position: f.position!,
          address: f.address,
        })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-cameroon-ivory text-cameroon-night font-sans min-h-screen flex flex-col pb-20">
      {/* Cameroon flag accent strip */}
      <div className="h-1 bg-cameroon-flag" />

      <header className="bg-white/95 backdrop-blur-md border-b border-cameroon-green/10 sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/app')} aria-label="Back" className="text-cameroon-green p-1 active:scale-95 transition-transform">
            <BackIcon />
          </button>
          <h1 className="text-xl font-black text-cameroon-green-deep tracking-tight">{t.next_steps}</h1>
        </div>
        <button
          onClick={() => setShowMap(!showMap)}
          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            showMap
              ? 'bg-cameroon-green text-white shadow-cameroon'
              : 'bg-cameroon-yellow text-cameroon-night shadow-sunset-glow'
          }`}
        >
          {showMap ? t.list : t.view_map}
        </button>
      </header>

      <main aria-labelledby="nextsteps-heading" className="flex-grow p-4 space-y-6 max-w-lg mx-auto w-full">
        {showMap ? (
          <section className="space-y-3">
            <FacilityMap facilities={allMappedFacilities} height="520px" />
            <p className="text-[10px] text-cameroon-green/60 uppercase tracking-widest text-center font-bold">
              {t.map_radius}
            </p>
          </section>
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-jungle text-white p-6 rounded-3xl shadow-premium relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-cameroon-yellow/20 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-cameroon-red/20 blur-2xl" />
              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 id="nextsteps-heading" className="text-lg font-black opacity-90">{t.scan_summary}</h2>
                    <p className="text-xs opacity-70 font-medium">{t.scanned_time}</p>
                  </div>
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">ID: 8829</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-cameroon-yellow/40 bg-white/10 shrink-0 flex items-center justify-center">
                      <ShareIcon className="text-cameroon-yellow" />
                    </div>
                    <div>
                      <p className="text-xs text-cameroon-yellow font-bold uppercase tracking-wider">{t.primary_found}</p>
                      <h3 className="text-xl font-black">Stage 1 Suspected</h3>
                    </div>
                  </div>
                  <button className="w-full bg-cameroon-yellow text-cameroon-night font-black py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sunset-glow">
                    <ShareIcon />
                    {t.share_report}
                  </button>
                </div>
              </div>
            </motion.section>

            <section className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {(['clinics', 'hospitals', 'pharmacies', 'telehealth'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                      activeTab === tab
                        ? 'bg-cameroon-green text-white shadow-cameroon'
                        : 'bg-white text-cameroon-green/70 border border-cameroon-green/15'
                    }`}
                  >
                    {t[tab] || tab}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {facilityData[activeTab].map((facility, idx) => (
                  <motion.article
                    key={`${activeTab}-${idx}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="bg-white p-3 rounded-2xl border border-cameroon-green/10 flex items-center gap-4 shadow-sm active:bg-cameroon-green/5 transition-colors"
                  >
                    <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center ${
                      activeTab === 'telehealth'
                        ? 'bg-medical-blue/10 text-medical-blue'
                        : activeTab === 'hospitals'
                        ? 'bg-cameroon-red/10 text-cameroon-red'
                        : activeTab === 'pharmacies'
                        ? 'bg-cameroon-yellow/15 text-cameroon-yellow-deep'
                        : 'bg-cameroon-green/10 text-cameroon-green'
                    }`}>
                      {activeTab === 'telehealth' ? <UsersIcon className="h-6 w-6" /> : <MapPinIcon className="w-6 h-6" />}
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-sm font-black text-cameroon-night leading-tight">{facility.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-medium">{facility.distance}</span>
                        <span className="text-[10px] font-black text-cameroon-yellow-deep">★ {facility.rating}</span>
                        <span className="text-[10px] text-cameroon-red font-bold">· {facility.type}</span>
                      </div>
                    </div>
                    {facility.position && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${facility.position.lat},${facility.position.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-black uppercase text-cameroon-green tracking-wider px-2.5 py-1.5 rounded-full bg-cameroon-green/10"
                      >
                        Go
                      </a>
                    )}
                  </motion.article>
                ))}
              </div>
            </section>
          </>
        )}

        <section className="mt-8 mb-6 p-6 rounded-2xl bg-cameroon-red/5 border-2 border-cameroon-red/30 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cameroon-red/15 text-cameroon-red mb-4">
            <WarningIcon />
          </div>
          <h4 className="text-cameroon-red-deep font-black text-lg mb-2 leading-tight">{t.disclaimer_title}</h4>
          <p className="text-cameroon-red-deep/85 font-semibold text-sm mb-4">{t.disclaimer_text}</p>
          <p className="text-cameroon-red/80 text-xs leading-relaxed uppercase tracking-wider font-bold">{t.disclaimer_consult}</p>
        </section>
      </main>

      <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 glass-effect border-t border-cameroon-green/10 px-8 py-4 flex justify-between items-center z-30">
        <button onClick={() => navigate('/app')} aria-label="Home" className="text-cameroon-green/60 active:scale-90 transition-transform"><HomeIcon /></button>
        <button onClick={() => navigate('/scanner')} aria-label="New scan" className="bg-cameroon-green w-14 h-14 rounded-2xl shadow-cameroon flex items-center justify-center text-white active:scale-95 transition-all -mt-12 border-4 border-cameroon-ivory">
          <PlusIcon />
        </button>
        <button onClick={() => navigate('/patients')} aria-label="Patients" className="text-cameroon-green/60 active:scale-90 transition-transform"><UsersIcon /></button>
      </nav>
    </div>
  );
};

export default NextSteps;
