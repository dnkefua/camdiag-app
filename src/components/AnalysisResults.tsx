import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { checkLocalContraindications } from '../services/api';
import { isApiConfigured } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { addPatientRecord as savePatientRecord } from '../services/firestore';
import { BackIcon, ArrowRightIcon, DocumentIcon, AlertIcon, DownloadIcon, UserIcon, HomeIcon, MapPinIcon, RemedyIcon } from '../components/ui/Icons';

const URGENCY_CONTENT = {
  emergency: {
    title: 'Emergency review recommended',
    message: 'The report may contain a critical finding. Seek emergency medical assessment now, especially if severe symptoms are present.',
    className: 'border-red-500 bg-red-50 text-red-800',
    iconClassName: 'bg-red-600',
  },
  same_day: {
    title: 'Same-day clinical review recommended',
    message: 'Arrange review by a qualified healthcare professional today and take the original report with you.',
    className: 'border-amber-400 bg-amber-50 text-amber-900',
    iconClassName: 'bg-amber-600',
  },
  routine: {
    title: 'Routine clinical follow-up',
    message: 'Discuss these findings with a qualified healthcare professional who can relate them to symptoms and medical history.',
    className: 'border-emerald-400 bg-emerald-50 text-emerald-900',
    iconClassName: 'bg-emerald-700',
  },
  unknown: {
    title: 'Clinical review required',
    message: 'Urgency could not be established from the report alone. Seek prompt care if symptoms are worsening or severe.',
    className: 'border-slate-300 bg-white text-slate-800',
    iconClassName: 'bg-slate-700',
  },
} as const;

const AnalysisResults = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    possibleFindings,
    markers,
    analysisUrgency,
    contraindications,
    analysisLimitations,
    analysisDisclaimer,
    selectedFinding,
    setSelectedFinding,
    analysisError,
    setAnalysisError,
    isAnalyzing,
    addPatientRecord,
    setPendingPages,
    setTranscription,
  } = useAppStore();
  const [selectedReportIndex, setSelectedReportIndex] = useState(selectedFinding);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const safetyRisk = checkLocalContraindications(possibleFindings);
  const isAiEnabled = isApiConfigured();
  const selectedReport = possibleFindings[selectedReportIndex];
  const urgencyContent = URGENCY_CONTENT[analysisUrgency];

  useEffect(() => {
    setPendingPages([]);
    setTranscription(null);
  }, [setPendingPages, setTranscription]);

  const handleSaveToRecords = async () => {
    if (!selectedReport || !user?.uid || saveState === 'saving') return;

    setSaveState('saving');
    setSaveError(null);

    const record = {
      userId: user.uid,
      date: new Date().toLocaleString(),
      diagnosis: selectedReport.name,
      status: selectedReport.likelihood,
      result: selectedReport.likelihood,
      category: 'AI Analysis',
      bodyPart: markers.map((marker) => marker.label).filter(Boolean).slice(0, 3).join(', ') || 'Medical document',
    };

    try {
      const id = await savePatientRecord(record);
      addPatientRecord({
        id,
        date: record.date,
        diagnosis: record.diagnosis,
        status: record.status,
        result: record.result,
        category: record.category,
        bodyPart: record.bodyPart,
      });
      setSaveState('saved');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save result.');
      setSaveState('error');
    }
  };

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
            <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">Google Cloud AI</span>
          )}
        </div>
      </header>

      {isAnalyzing && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-2 border-slate-600 border-t-medical-green rounded-full animate-spin" />
          <div className="text-center text-white">
            <p className="text-lg font-bold">{t.analyzing}</p>
            <p className="text-xs text-slate-400 mt-1">Verified document analysis</p>
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

        <section className={`border-2 rounded-xl p-4 flex items-start gap-3 shadow-sm ${urgencyContent.className}`}>
          <div className={`${urgencyContent.iconClassName} text-white p-2 rounded-full shrink-0`}>
            <AlertIcon />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-sm">{urgencyContent.title}</h3>
            <p className="text-xs mt-1 font-medium leading-relaxed">{urgencyContent.message}</p>
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
                <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded-full">{safetyRisk.medications.join(' + ')}</span>
              </div>
            </div>
          </motion.section>
        )}

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">{t.possible_findings}</h3>
          <p className="text-[10px] text-slate-400 font-medium italic px-1">{t.ai_confidence_not_clinical}</p>
          <div className="space-y-3">
            {possibleFindings.length === 0 && !isAnalyzing && (
              <div className="bg-white p-5 rounded-3xl border border-slate-100 text-center">
                <p className="text-sm text-slate-500 font-medium">No possible findings to display. Scan an image to get started.</p>
              </div>
            )}
            {possibleFindings.map((finding, idx) => (
              <button
                key={finding.name}
                onClick={() => { setSelectedReportIndex(idx); setSelectedFinding(idx); }}
                className={`w-full text-left p-5 rounded-3xl border-2 transition-all duration-300 transform ${selectedReportIndex === idx ? 'bg-white border-medical-green shadow-xl shadow-medical-green/10 scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-200'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className={`font-black ${selectedReportIndex === idx ? 'text-medical-green text-lg' : 'text-slate-800'}`}>{finding.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${selectedReportIndex === idx ? 'bg-medical-green text-white' : 'bg-slate-100 text-slate-500'}`}>{finding.likelihood}</span>
                </div>
                {selectedReportIndex === idx && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 pt-2 border-t border-slate-50"
                  >
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-1">{t.clinical_reasoning}</p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">{finding.reasoning}</p>
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </section>

        {selectedReport && (
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Selected report</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">{selectedReport.name}</h3>
            </div>

            {selectedReport.observedEvidence.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Evidence from the report</h4>
                <ul className="space-y-2">
                  {selectedReport.observedEvidence.map((evidence, index) => (
                    <li key={`${evidence}-${index}`} className="border-l-4 border-slate-300 pl-3 text-sm leading-relaxed text-slate-700">
                      {evidence}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Clinical interpretation</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{selectedReport.reasoning}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider">Medication options and safety notes</h4>
              <p className="text-xs leading-relaxed text-slate-500">These are considerations for a licensed clinician or pharmacist, not a prescription. Do not start, stop, or change medication from this report.</p>
              {selectedReport.medicationSafetyNotes.length > 0 ? (
                <div className="space-y-2">
                  {selectedReport.medicationSafetyNotes.map((note, i) => (
                    <div key={`${note}-${i}`} className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 p-3">
                      <span className="mt-0.5 rounded bg-blue-700 px-2 py-1 text-[10px] font-black text-white">REVIEW</span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">{note}</p>
                        <p className="mt-1 text-[10px] text-slate-500 font-medium">Confirm diagnosis, allergies, pregnancy status, current medicines, and kidney/liver function as applicable.</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No medication safety notes returned for this finding.</p>
              )}
            </div>

            {selectedReport.traditionalRemedyWarnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-amber-700 uppercase tracking-wider">Remedy and self-medication cautions</h4>
                <div className="space-y-2">
                  {selectedReport.traditionalRemedyWarnings.map((item, i) => (
                    <div key={`${item}-${i}`} className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-sm font-medium text-amber-900">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedReport.recommendedNextSteps.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">Recommended next steps</h4>
                <ol className="space-y-2">
                  {selectedReport.recommendedNextSteps.map((step, index) => (
                    <li key={`${step}-${index}`} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        )}

        {contraindications.length > 0 && (
          <section className="space-y-3" aria-labelledby="contraindications-heading">
            <div>
              <h3 id="contraindications-heading" className="text-sm font-black uppercase tracking-wider text-red-800">Contraindications and interactions</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">Potential safety conflicts from the report and supplied patient context. A clinician or pharmacist must verify them.</p>
            </div>
            {contraindications.map((item, index) => (
              <div key={`${item.risk}-${index}`} className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-red-700 px-2 py-1 text-[10px] font-black uppercase text-white">{item.severity}</span>
                  <span className="text-xs font-black text-red-900">{item.medications.join(' + ')}</span>
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-red-900">{item.risk}</p>
              </div>
            ))}
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
              const isActive = possibleFindings[selectedReportIndex]?.markers.includes(marker.id);
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

        {analysisLimitations.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">Important limitations</h3>
            <ul className="mt-3 space-y-2">
              {analysisLimitations.map((limitation, index) => (
                <li key={`${limitation}-${index}`} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="pt-2 pb-8 space-y-3">
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
            <button className="w-full min-w-0 bg-slate-900 justify-center text-white text-xs font-bold py-3 px-2 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center gap-1">
              <DownloadIcon />
              <span className="truncate">{t.download_pdf}</span>
            </button>
            <button
              onClick={handleSaveToRecords}
              disabled={!selectedReport || !user?.uid || saveState === 'saving'}
              className="w-full min-w-0 bg-medical-blue justify-center text-white text-xs font-bold py-3 px-2 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center gap-1"
            >
              <UserIcon className="h-4 w-4" />
              <span className="truncate">
                {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : t.save_to_records}
              </span>
            </button>
          </div>
          {saveState === 'saved' && (
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="w-full text-xs font-bold text-medical-blue underline"
            >
              View saved records
            </button>
          )}
          {saveError && (
            <p className="text-xs font-medium text-red-600 text-center">{saveError}</p>
          )}

          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/next-steps?tab=hospitals')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-medical-green bg-white px-3 py-3 text-sm font-bold text-medical-green active:bg-medical-green/5"
            >
              <MapPinIcon className="h-5 w-5" />
              Nearby hospitals
            </button>
            <button
              onClick={() => navigate('/next-steps?tab=pharmacies')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-medical-blue bg-white px-3 py-3 text-sm font-bold text-medical-blue active:bg-blue-50"
            >
              <RemedyIcon className="h-5 w-5" />
              Nearby pharmacies
            </button>
          </div>

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
            {analysisDisclaimer || t.disclaimer_text} <span className="text-medical-green font-bold block mt-1">{t.disclaimer_consult}</span>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default AnalysisResults;
