import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { checkLocalContraindications } from '../services/api';
import { isApiConfigured } from '../services/api';
import { BackIcon, ArrowRightIcon, DocumentIcon, AlertIcon, DownloadIcon, UserIcon, HomeIcon } from '../components/ui/Icons';

const AnalysisResults = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { diagnoses, markers, selectedDiagnosis, setSelectedDiagnosis, analysisError, setAnalysisError, isAnalyzing } = useAppStore();
  const [selectedDiag, setSelectedDiag] = useState(selectedDiagnosis);

  const safetyRisk = checkLocalContraindications(diagnoses);
  const isAiEnabled = isApiConfigured();
  const selectedReport = diagnoses[selectedDiag];

  return (
    <div className="bg-slate-50 text-slate-900 font-sans h-[100svh] h-[100dvh] flex flex-col overflow-hidden">
      <a href="#analysis-main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:text-medical-green focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-xl focus:font-bold">
        Skip to main content
      </a>
      <header className="bg-white border-b border-slate-200 shrink-0 z-10 px-4 py-3 flex items-center justify-between gap-3 shadow-sm safe-area-top">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/scanner')} aria-label="Back" className="text-slate-600 p-1 active:scale-90 transition-transform">
            <BackIcon />
          </button>
          <h1 className="text-xl font-bold text-cameroon-green">{t.analysis_title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-medical-green animate-pulse"></span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.ai_active}</span>
          {isAiEnabled && (
            <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">MedGemma</span>
          )}
        </div>
      </header>

      {isAnalyzing && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-2 border-slate-600 border-t-medical-green rounded-full animate-spin" />
          <div className="text-center text-white">
            <p className="text-lg font-bold">{t.analyzing}</p>
            <p className="text-xs text-slate-400 mt-1">MedGemma AI</p>
          </div>
        </div>
      )}

      {analysisError && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertIcon className="h-4 w-4 text-orange-500 shrink-0" />
            <span className="text-xs text-orange-700 font-medium">{analysisError}</span>
          </div>
          <button onClick={() => setAnalysisError(null)} className="text-orange-500 font-bold text-xs ml-4">Dismiss</button>
        </div>
      )}

      <main
        id="analysis-main"
        aria-labelledby="analysis-heading"
        className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 pt-4 pb-10 space-y-6 max-w-lg mx-auto w-full"
      >
        <h2 id="analysis-heading" className="sr-only">{t.analysis_title}</h2>

        <section className="bg-red-50 border-2 border-red-500 rounded-3xl p-4 flex items-start gap-3 shadow-lg">
          <div className="bg-red-500 text-white p-2 rounded-full shrink-0">
            <AlertIcon />
          </div>
          <div>
            <h3 className="text-red-700 font-black text-sm">{t.red_flag_warning}</h3>
            <p className="text-red-600 text-xs mt-1 font-medium">{t.red_flag_emergency}</p>
          </div>
        </section>

        <section
          onClick={() => navigate('/questionnaire')}
          className="bg-gradient-to-r from-cameroon-green to-medical-green p-4 rounded-3xl text-white shadow-lg cursor-pointer active:scale-[0.98] transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <DocumentIcon />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">{t.questionnaire_title}</p>
              <p className="text-sm font-black">{t.quest_intro}</p>
            </div>
          </div>
          <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ArrowRightIcon />
          </motion.div>
        </section>

        {safetyRisk && (
          <motion.section
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-50 border-2 border-red-500 rounded-3xl p-5 flex items-start gap-4 shadow-lg shadow-red-100 relative overflow-hidden"
          >
            <div className="bg-red-500 text-white p-2 rounded-full animate-bounce shrink-0 shadow-lg">
              <AlertIcon />
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

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">{t.diagnoses}</h3>
          <p className="text-[10px] text-slate-400 font-medium italic px-1">{t.ai_confidence_not_clinical}</p>
          <div className="space-y-3">
            {diagnoses.length === 0 && !isAnalyzing && (
              <div className="bg-white p-5 rounded-3xl border border-slate-100 text-center">
                <p className="text-sm text-slate-500 font-medium">No diagnoses to display. Scan an image to get started.</p>
              </div>
            )}
            {diagnoses.map((diag, idx) => (
              <button
                key={diag.name}
                onClick={() => { setSelectedDiag(idx); setSelectedDiagnosis(idx); }}
                className={`w-full text-left p-5 rounded-3xl border-2 transition-all duration-300 transform ${selectedDiag === idx ? 'bg-white border-medical-green shadow-xl shadow-medical-green/10 scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-200'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className={`font-black ${selectedDiag === idx ? 'text-medical-green text-lg' : 'text-slate-800'}`}>{diag.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${selectedDiag === idx ? 'bg-medical-green text-white' : 'bg-slate-100 text-slate-500'}`}>{diag.probability}</span>
                </div>
                {selectedDiag === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 pt-2 border-t border-slate-50"
                  >
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-1">{t.clinical_reasoning}</p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">{diag.reasoning}</p>
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </section>

        {selectedReport && (
          <section className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Selected report</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">{t.prognosis}</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{selectedReport.reasoning}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider">Suggested medication</h4>
              {selectedReport.drugs.length > 0 ? (
                <div className="space-y-2">
                  {selectedReport.drugs.map((drug, i) => (
                    <div key={`${drug}-${i}`} className="flex items-start gap-3 rounded-2xl bg-blue-50 border border-blue-100 p-3">
                      <span className="mt-0.5 rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-black text-white">RX</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{drug}</p>
                        <p className="text-[10px] text-slate-500 font-medium italic">{t.cameroon_avail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No medication suggestion returned for this finding.</p>
              )}
            </div>

            {selectedReport.contri.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-amber-700 uppercase tracking-wider">Contraindications and cautions</h4>
                <div className="space-y-2">
                  {selectedReport.contri.map((item, i) => (
                    <div key={`${item}-${i}`} className="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-sm font-medium text-amber-900">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">{t.clinical_markers}</h3>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 sm:gap-4">
            {markers.length === 0 && !isAnalyzing && (
              <div className="col-span-2 bg-white p-5 rounded-3xl border border-slate-100 text-center">
                <p className="text-sm text-slate-500 font-medium">No clinical markers detected.</p>
              </div>
            )}
            {markers.map((marker) => {
              const isActive = diagnoses[selectedDiag]?.markers.includes(marker.id);
              return (
                  <div key={marker.id}
                  className={`p-4 rounded-3xl border transition-all duration-500 ${isActive ? 'bg-white border-medical-green shadow-lg scale-105 z-10 ring-4 ring-medical-green/5' : 'bg-slate-50 border-slate-100 opacity-40 grayscale blur-[0.5px]'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-2 w-2 rounded-full ${marker.color === 'red' ? 'bg-red-500' : 'bg-orange-500'}`} role="img" aria-label={`${marker.status} marker`}></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{marker.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-800">{marker.value}</span>
                    <span className={`text-[10px] font-bold ${marker.color === 'red' ? 'text-red-500' : 'text-orange-500'}`}>
                      <span className="sr-only">Status: </span>
                      {marker.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="pt-2 pb-8 space-y-3">
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
            <button className="w-full min-w-0 bg-slate-900 justify-center text-white text-xs font-bold py-3 px-2 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center gap-1">
              <DownloadIcon />
              <span className="truncate">{t.download_pdf}</span>
            </button>
            <button
              onClick={() => navigate('/patients')}
              className="w-full min-w-0 bg-medical-blue justify-center text-white text-xs font-bold py-3 px-2 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center gap-1"
            >
              <UserIcon className="h-4 w-4" />
              <span className="truncate">{t.save_to_records}</span>
            </button>
          </div>

          <button
            onClick={() => navigate('/next-steps')}
            className="w-full bg-white text-medical-green border-2 border-medical-green font-bold py-3 rounded-xl active:bg-medical-green/5 transition-all"
          >
            {t.find_clinic}
          </button>

          <button
            onClick={() => navigate('/app')}
            className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-xl active:bg-slate-200 transition-all flex justify-center items-center gap-2"
          >
            <HomeIcon className="h-4 w-4" />
            {t.return_dashboard}
          </button>
        </div>

        <footer className="px-5 pb-10 text-center">
          <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto leading-relaxed">
            {t.disclaimer_text} <span className="text-medical-green font-bold block mt-1">{t.disclaimer_consult}</span>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default AnalysisResults;
