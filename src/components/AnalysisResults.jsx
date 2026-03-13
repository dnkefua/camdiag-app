import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AnalysisResults = ({ onNext, onBack, onNavigate, t }) => {
  const [selectedDiag, setSelectedDiag] = useState(0); // Default to the first (primary) diagnosis

  const diagnoses = [
    { 
      name: 'Malaria (P. Falciparum)', 
      prob: '94%', 
      markers: ['parasites', 'hematocrit'],
      drugs: ['Coartem', 'Quinine'],
      contri: ['Artemisia Tea', 'Papaya Leaves'],
      reasoning: 'High parasite count and low hematocrit suggest active malaria infection.'
    },
    { 
      name: 'Bacterial Dermatitis', 
      prob: '12%', 
      markers: ['hematocrit'],
      drugs: ['Amoxicillin', 'Ciprofloxacine'],
      contri: ['Aloe Vera', 'Honey'],
      reasoning: 'Skin-surface inflammation matches typical bacterial patterns.'
    }
  ];

  const markers = [
    { id: 'hematocrit', label: t.hematocrit, value: '32%', status: 'Low', color: 'orange' },
    { id: 'parasites', label: t.malaria_parasites, value: '2500/µL', status: 'High', color: 'red' }
  ];

  // Safety Engine: Definition of malicious interactions
  const contraindications = [
    { drugs: ['Coartem', 'Quinine'], risk: 'Severe arrhythmia risk when combined.' },
    { drugs: ['Amoxicillin', 'Quinine'], risk: 'Increased risk of gastrointestinal distress.' }
  ];

  const checkSafety = () => {
    const allRecommendedDrugs = diagnoses.flatMap(d => d.drugs);
    const uniqueDrugs = [...new Set(allRecommendedDrugs)];
    
    for (const conflict of contraindications) {
      const match = conflict.drugs.every(d => uniqueDrugs.includes(d));
      if (match) return conflict;
    }
    return null;
  };

  const safetyRisk = checkSafety();

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-slate-600 p-1 active:scale-90 transition-transform">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>
          <h1 className="text-xl font-bold text-cameroon-green">{t.analysis_title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-medical-green animate-pulse"></span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.ai_active}</span>
        </div>
      </header>

      <main className="p-5 space-y-6 max-w-lg mx-auto w-full">
        {/* Questionnaire Reward CTA */}
        <section 
          onClick={() => onNavigate('questionnaire')}
          className="bg-gradient-to-r from-cameroon-green to-medical-green p-4 rounded-3xl text-white shadow-lg cursor-pointer active:scale-[0.98] transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">{t.questionnaire_title}</p>
              <p className="text-sm font-black">{t.quest_intro}</p>
            </div>
          </div>
          <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </motion.div>
        </section>

        {/* Safety Warning Sign (Refined with specific drug listing) */}
        {safetyRisk && (
          <motion.section 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-50 border-2 border-red-500 rounded-3xl p-5 flex items-start gap-4 shadow-lg shadow-red-100 relative overflow-hidden"
          >
            <div className="bg-red-500 text-white p-2 rounded-full animate-bounce shrink-0 shadow-lg">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-red-700 font-black text-sm uppercase tracking-wider">{t.contraindication_detected}</h3>
              <p className="text-red-600 text-xs font-bold leading-tight mt-1">{safetyRisk.risk}</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-[10px] font-black text-red-700 uppercase">{t.conflicting_with}</span>
                <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded-full">{safetyRisk.drugs.join(' + ')}</span>
              </div>
            </div>
          </motion.section>
        )}

        {/* Possible Diagnoses */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">{t.diagnoses}</h3>
          <div className="space-y-3">
            {diagnoses.map((diag, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedDiag(idx)}
                className={`w-full text-left p-5 rounded-3xl border-2 transition-all duration-300 transform ${selectedDiag === idx ? 'bg-white border-medical-green shadow-xl shadow-medical-green/10 scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-200'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className={`font-black tracking-tight ${selectedDiag === idx ? 'text-medical-green text-lg' : 'text-slate-800'}`}>{diag.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${selectedDiag === idx ? 'bg-medical-green text-white' : 'bg-slate-100 text-slate-500'}`}>{diag.prob}</span>
                </div>
                {selectedDiag === idx && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 pt-2 border-t border-slate-50"
                  >
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-1">{t.clinical_reasoning}</p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                      {diag.reasoning}
                    </p>
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Clinical Markers (Interactive Linking) */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">{t.clinical_markers}</h3>
          <div className="grid grid-cols-2 gap-4">
            {markers.map((marker) => {
              const isActive = diagnoses[selectedDiag].markers.includes(marker.id);
              return (
                <div 
                  key={marker.id}
                  className={`p-4 rounded-3xl border transition-all duration-500 ${isActive ? 'bg-white border-medical-green shadow-lg scale-105 z-10 ring-4 ring-medical-green/5' : 'bg-slate-50 border-slate-100 opacity-40 grayscale blur-[0.5px]'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-2 w-2 rounded-full ${marker.color === 'red' ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{marker.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-800">{marker.value}</span>
                    <span className={`text-[10px] font-bold ${marker.color === 'red' ? 'text-red-500' : 'text-orange-500'}`}>{marker.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Remedies & Support Section */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-slate-900 font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <svg className="w-5 h-5 text-medical-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.183.31l-.233.155A2 2 0 004 17.34V20a2 2 0 002 2h12a2 2 0 002-2v-2.66a2 2 0 00-.572-1.414l-.5-.5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            {t.remedies_title}
          </h3>
          
          <div className="space-y-4">
            {/* Prescribed */}
            <div className="border border-blue-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="bg-blue-50 px-5 py-2 border-b border-blue-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">{t.prescribed}</span>
              </div>
              <div className="p-5 space-y-3">
                {diagnoses[selectedDiag].drugs.map((drug, i) => {
                  const isConflicting = safetyRisk && safetyRisk.drugs.includes(drug);
                  return (
                    <div key={i} className="flex items-center gap-3 group">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 active:scale-90 transition-transform cursor-pointer ${isConflicting ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100 text-blue-600'}`}>RX</div>
                      <div>
                        <p className={`text-sm font-bold transition-colors ${isConflicting ? 'text-red-600 underline decoration-red-500 decoration-2 underline-offset-4' : 'text-slate-800 group-hover:text-blue-600'}`}>{drug}</p>
                        <p className="text-[10px] text-slate-500 font-medium italic">{t.cameroon_avail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contri-medicine */}
            <div className="border border-emerald-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="bg-emerald-50 px-5 py-2 border-b border-emerald-100">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{t.contri_medicine}</span>
              </div>
              <div className="p-5 space-y-3">
                {diagnoses[selectedDiag].contri.map((herb, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-[10px] shrink-0 active:scale-90 transition-transform cursor-pointer">HERB</div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{herb}</p>
                      <p className="text-[10px] text-slate-500 font-medium italic">Traditional Remedy (Cameroon)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="pt-2 pb-8 space-y-3">
          <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            {t.download_pdf}
          </button>
          <button 
            onClick={onNext}
            className="w-full bg-white text-medical-green border-2 border-medical-green font-bold py-4 rounded-2xl active:bg-medical-green/5 transition-all"
          >
            {t.find_clinic}
          </button>
        </div>
      </main>

      {/* Modern Disclaimer */}
      <footer className="px-5 pb-10 text-center">
        <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto leading-relaxed">
          {t.disclaimer_text} <span className="text-medical-green font-bold block mt-1">{t.disclaimer_consult}</span>
        </p>
      </footer>
    </div>
  );
};

export default AnalysisResults;
