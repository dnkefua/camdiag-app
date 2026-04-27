import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { analyzeMedicalImage } from '../services/medgemma';
import { isApiConfigured } from '../services/api';
import { CloseIcon, FlashIcon, CheckIcon, ImageIcon, AlertIcon } from '../components/ui/Icons';

const Scanner = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { scanCount, incrementScanCount, resetScanCount, setDiagnoses, setMarkers, setAnalyzing, setAnalysisError, isAnalyzing } = useAppStore();

  const [flashOn, setFlashOn] = useState(false);
  const [scanMode, setScanMode] = useState<'document' | 'body'>('document');
  const [showError, setShowError] = useState(false);
  const [flashOverlay, setFlashOverlay] = useState(false);

  const handleCapture = () => {
    if (scanMode === 'body') {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    setFlashOverlay(true);
    setTimeout(() => {
      setFlashOverlay(false);
      incrementScanCount();
    }, 200);
  };

  const handleDone = async () => {
    if (scanCount === 0) return;

    resetScanCount();

    if (isApiConfigured()) {
      setAnalyzing(true);
      setAnalysisError(null);

      try {
        const result = await analyzeMedicalImage({
          prompt: 'Analyze this medical scan/document. Identify potential conditions, clinical markers, recommended medications available in Cameroon, drug interactions, and traditional remedies.',
          language,
        });

        if (result.diagnoses.length > 0) {
          setDiagnoses(result.diagnoses);
        }
        if (result.markers.length > 0) {
          setMarkers(result.markers);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed. Using local data instead.';
        setAnalysisError(message);
      } finally {
        setAnalyzing(false);
      }
    }

    navigate('/analysis');
  };

  return (
    <div className="bg-black h-screen w-full overflow-hidden flex flex-col text-white font-sans">
      {flashOverlay && (
        <div className="fixed inset-0 bg-white z-[100] transition-opacity duration-150" />
      )}

      {isAnalyzing && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-2 border-slate-600 border-t-medical-green rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-lg font-bold">{t.analyzing}</p>
            <p className="text-xs text-slate-400 mt-1">MedGemma AI</p>
          </div>
        </div>
      )}

      <header className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => navigate('/app')} aria-label={t.close_scanner} className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
          <CloseIcon />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-semibold tracking-wide uppercase">{t.camdiag_scan}</h1>
          <p className="text-[10px] text-gray-300">{t.lab_test}</p>
        </div>
        <button
          onClick={() => setFlashOn(!flashOn)}
          aria-label="Toggle flash"
          className={`p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 ${flashOn ? 'opacity-100' : 'opacity-60'}`}
        >
          <FlashIcon className={flashOn ? 'h-6 w-6 text-yellow-400' : 'h-6 w-6'} />
        </button>
      </header>

      <main aria-labelledby="scanner-heading" className="flex-grow relative overflow-hidden viewfinder-bg flex items-center justify-center">
        <h2 id="scanner-heading" className="sr-only">{t.scan}</h2>
        {showError && (
          <div className="absolute top-1/4 left-0 right-0 z-50 flex justify-center px-6 animate-pulse">
            <div className="bg-red-500/90 text-white px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border border-red-400 text-center">
              <AlertIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="font-bold text-lg">{t.invalid_subject}</p>
              <p className="font-medium text-sm mt-1 text-red-100">{t.invalid_subject_desc}</p>
            </div>
          </div>
        )}

        <div className="absolute top-10 left-0 right-0 mx-auto w-full flex justify-center z-10">
          <button
            onClick={() => setScanMode(prev => prev === 'document' ? 'body' : 'document')}
            className={`min-w-[140px] px-4 py-2 rounded-full text-sm font-bold border backdrop-blur-md transition-all ${
              scanMode === 'document' ? 'bg-black/40 border-white/20 text-white' : 'bg-orange-500/80 border-orange-400 text-white'
            }`}
          >
            Mode: {scanMode === 'document' ? `\uD83D\uDCF8 ${t.mode_document}` : `\uD83D\uDC64 ${t.mode_body}`}
          </button>
        </div>

        <div className="guide-box relative w-4/5 aspect-[3/4] max-w-sm rounded-sm transition-all duration-300">
          <div className="corner corner-tl"></div>
          <div className="corner corner-tr"></div>
          <div className="corner corner-bl"></div>
          <div className="corner corner-br"></div>
          <div className="scan-line"></div>
        </div>

        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
          <div className="flex items-center space-x-2 bg-blue-600/90 px-4 py-2 rounded-lg animate-pulse">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">{t.positioning}</span>
          </div>
        </div>
      </main>

      <footer className="bg-black/90 pb-10 pt-6 px-8 flex items-center justify-between">
        <button aria-label="Open gallery" className="flex flex-col items-center space-y-1 group">
          <div className="p-3 rounded-full bg-white/10 group-active:bg-white/20 transition-colors">
            <ImageIcon />
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{t.gallery}</span>
        </button>

        <button onClick={handleCapture} aria-label={t.scan} className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center p-1">
            <div className="w-full h-full bg-white rounded-full active:scale-90 transition-transform duration-75"></div>
          </div>
        </button>

        {scanCount > 0 ? (
          <button onClick={handleDone} className="flex flex-col items-center space-y-1 group text-medical-green animate-pulse">
            <div className="p-3 rounded-full bg-medical-green/20 border border-medical-green/40">
              <CheckIcon className="h-6 w-6 text-medical-green" />
            </div>
            <span className="text-[10px] font-bold">{t.done} ({scanCount})</span>
          </button>
        ) : (
          <div className="w-12"></div>
        )}
      </footer>
    </div>
  );
};

export default Scanner;