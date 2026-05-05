import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCamera } from '../hooks/useCamera';
import { useAppStore } from '../store/useAppStore';
import { analyzeMedicalImage } from '../services/medgemma';
import { isApiConfigured } from '../services/api';
import { trackEvent } from '../services/analytics';
import { CloseIcon, FlashIcon, CheckIcon, ImageIcon, AlertIcon } from '../components/ui/Icons';

const Scanner = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const {
    setPossibleFindings,
    setMarkers,
    setAnalyzing,
    setAnalysisError,
    isAnalyzing,
  } = useAppStore();
  const camera = useCamera();

  const [scanMode, setScanMode] = useState<'document' | 'body'>('document');
  const [showError, setShowError] = useState(false);
  const [flashOverlay, setFlashOverlay] = useState(false);
  const [captures, setCaptures] = useState<Array<{ dataUrl: string; blob: Blob }>>([]);
  const [showTriage, setShowTriage] = useState(false);

    useEffect(() => {
      camera.start().catch(error => console.error('Camera start error:', error));
      trackEvent('scanner_open');
      return () => camera.stop();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  const handleCapture = async () => {
    if (scanMode === 'body') {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    if (!camera.isReady) return;

    setFlashOverlay(true);
    const shot = await camera.capture();
    setTimeout(() => setFlashOverlay(false), 180);

    if (shot) {
      setCaptures((prev) => [...prev, shot]);
      trackEvent('scanner_capture', { count: captures.length + 1 });
    }
  };

  const completeScan = async (hasEmergencySigns: boolean) => {
    if (captures.length === 0) return;
    const primary = captures[captures.length - 1];
    if (!primary) return;

    if (hasEmergencySigns) {
      setPossibleFindings([]);
      setMarkers([]);
      setAnalysisError('Emergency warning signs reported. Do not use AI analysis. Seek urgent medical care now.');
      setCaptures([]);
      setShowTriage(false);
      camera.stop();
      void navigate('/analysis');
      return;
    }

    if (isApiConfigured()) {
      setAnalyzing(true);
      setAnalysisError(null);
      try {
        const result = await analyzeMedicalImage({
          imageBase64: primary.dataUrl,
          documentType: 'medical_document',
          language,
        });
        if (result.possibleFindings.length > 0) setPossibleFindings(result.possibleFindings);
        if (result.markers.length > 0) setMarkers(result.markers);
        trackEvent('scanner_analysis_success', { possibleFindings: result.possibleFindings.length });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed. Using local data instead.';
        setAnalysisError(message);
        trackEvent('scanner_analysis_error', { message });
      } finally {
        setAnalyzing(false);
      }
    }

     setCaptures([]);
     setShowTriage(false);
     camera.stop();
     void navigate('/analysis');
  };

  const handleDone = async () => {
    if (captures.length === 0) return;
    setShowTriage(true);
  };

  const handleGalleryUpload = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
    setCaptures((prev) => [...prev, { dataUrl, blob: file }]);
    trackEvent('scanner_gallery_upload');
  };

  return (
    <div className="bg-cameroon-night screen-safe w-full overflow-hidden flex flex-col text-white font-sans">
      {flashOverlay && (
        <div className="fixed inset-0 bg-white z-[100] transition-opacity duration-150 pointer-events-none" />
      )}

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] glass-dark flex flex-col items-center justify-center gap-6"
          >
            <div className="relative w-20 h-20">
              <motion.div
                className="absolute inset-0 border-2 border-cameroon-yellow/30 border-t-cameroon-yellow rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-2 border-2 border-cameroon-red/30 border-b-cameroon-red rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{t.analyzing}</p>
              <p className="text-xs text-cameroon-yellow mt-1 tracking-widest">MedGemma AI</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTriage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-5"
          >
            <motion.section
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              className="w-full max-w-sm rounded-2xl bg-white text-slate-900 p-5 shadow-2xl border border-red-200"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-red-100 p-2 text-red-600">
                  <AlertIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-red-700">Emergency check</h2>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">
                    Is the patient having severe breathing trouble, chest pain, heavy bleeding, seizure, confusion,
                    unconsciousness, severe allergic reaction, or another emergency warning sign?
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => void completeScan(true)}
                  className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white active:scale-[0.98]"
                >
                  Yes, seek urgent care
                </button>
                <button
                  type="button"
                  onClick={() => void completeScan(false)}
                  className="w-full rounded-xl bg-cameroon-green px-4 py-3 text-sm font-black text-white active:scale-[0.98]"
                >
                  No emergency signs
                </button>
                <button
                  type="button"
                  onClick={() => setShowTriage(false)}
                  className="w-full rounded-xl bg-slate-100 px-4 py-3 text-xs font-bold text-slate-600 active:scale-[0.98]"
                >
                  Review scan first
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live camera stream */}
      <video
        ref={camera.videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Permission / device error */}
      {camera.error && (
        <div className="absolute inset-0 z-50 bg-cameroon-night/95 flex items-center justify-center p-6">
          <div className="max-w-sm text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-cameroon-red/20 border-2 border-cameroon-red/40 flex items-center justify-center">
              <AlertIcon className="w-8 h-8 text-cameroon-red" />
            </div>
            <h3 className="text-xl font-black">Camera unavailable</h3>
            <p className="text-sm text-white/70">{camera.error}</p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => camera.start()}
                className="px-5 py-2.5 rounded-full bg-cameroon-yellow text-cameroon-night font-bold text-sm"
              >
                Retry
              </button>
              <button
                onClick={() => navigate('/app')}
                className="px-5 py-2.5 rounded-full bg-white/10 text-white font-bold text-sm border border-white/20"
              >
                Back to hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Starting state */}
      {camera.isStarting && !camera.error && (
        <div className="absolute inset-0 z-30 bg-cameroon-night/70 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-2 border-cameroon-yellow/30 border-t-cameroon-yellow rounded-full"
          />
        </div>
      )}

      <header className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
         <button
           onClick={async () => {
             camera.stop();
             void navigate('/app');
           }}
           aria-label={t.close_scanner}
           className="p-2 rounded-full bg-black/30 backdrop-blur-md border border-white/15 active:scale-90 transition-transform"
         >
          <CloseIcon />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black tracking-widest uppercase">{t.camdiag_scan}</h1>
          <p className="text-[10px] text-cameroon-yellow/80 font-medium tracking-wider">{t.lab_test}</p>
        </div>
        {camera.hasFlashSupport ? (
          <button
            onClick={() => camera.toggleFlash()}
            aria-label="Toggle flash"
            className={`p-2 rounded-full backdrop-blur-md border transition-all ${
              camera.flashOn
                ? 'bg-cameroon-yellow text-cameroon-night border-cameroon-yellow shadow-sunset-glow'
                : 'bg-black/30 border-white/15'
            }`}
          >
            <FlashIcon className="h-6 w-6" />
          </button>
        ) : (
          <button
            onClick={() => camera.toggleFacing()}
            aria-label="Switch camera"
            className="p-2 rounded-full bg-black/30 backdrop-blur-md border border-white/15"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </header>

      <main aria-labelledby="scanner-heading" className="relative flex-grow overflow-hidden flex items-center justify-center">
        <h2 id="scanner-heading" className="sr-only">{t.scan}</h2>

        {/* Vignette darkening outside the guide-box */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        </div>

        {showError && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-6 left-0 right-0 z-50 flex justify-center px-6"
          >
            <div className="bg-cameroon-red/95 text-white px-6 py-4 rounded-2xl shadow-red-glow backdrop-blur-md border border-cameroon-red-light text-center max-w-sm">
              <AlertIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="font-black text-lg">{t.invalid_subject}</p>
              <p className="font-medium text-sm mt-1 text-red-50">{t.invalid_subject_desc}</p>
            </div>
          </motion.div>
        )}

        <div className="absolute top-20 left-0 right-0 mx-auto w-full flex justify-center z-10 px-4">
          <button
            onClick={() => setScanMode((prev) => (prev === 'document' ? 'body' : 'document'))}
            className={`min-w-[160px] min-h-11 px-4 py-2 rounded-full text-sm font-black border backdrop-blur-md transition-all ${
              scanMode === 'document'
                ? 'bg-black/40 border-cameroon-yellow/40 text-white'
                : 'bg-cameroon-red/85 border-cameroon-red-light text-white'
            }`}
          >
            Mode: {scanMode === 'document' ? `📸 ${t.mode_document}` : `👤 ${t.mode_body}`}
          </button>
        </div>

        <div className="guide-box relative w-4/5 aspect-[3/4] max-w-sm transition-all duration-300">
          <div className="corner corner-tl"></div>
          <div className="corner corner-tr"></div>
          <div className="corner corner-bl"></div>
          <div className="corner corner-br"></div>
          {camera.isReady && <div className="scan-line"></div>}
        </div>

        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
          <div className="flex items-center gap-2 bg-cameroon-green/85 px-5 py-2 rounded-full backdrop-blur-md shadow-cameroon-glow">
            <motion.div
              className="w-2 h-2 rounded-full bg-cameroon-yellow"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            <span className="text-xs font-bold tracking-wide">{t.positioning}</span>
          </div>
        </div>
      </main>

      <footer className="relative z-10 bg-gradient-to-t from-black via-black/85 to-transparent pt-6 px-6 sm:px-8 flex items-center justify-between safe-area-bottom">
        <label aria-label="Open gallery" className="flex flex-col items-center gap-1 group cursor-pointer">
          <div className="p-3 rounded-full bg-white/10 group-active:bg-white/20 transition-colors border border-white/15">
            <ImageIcon />
          </div>
          <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">{t.gallery}</span>
           <input
             type="file"
             accept="image/*"
             className="hidden"
             onChange={async (e) => {
               const file = e.target.files?.[0];
               if (file) {
                 await handleGalleryUpload(file);
               }
               e.target.value = '';
             }}
           />
        </label>

        <button
          onClick={handleCapture}
          aria-label={t.scan}
          disabled={!camera.isReady}
          className="relative flex items-center justify-center disabled:opacity-50"
        >
          <div className="absolute inset-0 rounded-full bg-cameroon-yellow/30 animate-ping" />
          <div className="w-20 h-20 rounded-full border-4 border-cameroon-yellow/50 flex items-center justify-center p-1">
            <div className="w-full h-full bg-gradient-to-br from-white to-cameroon-yellow-light rounded-full active:scale-90 transition-transform duration-75 shadow-lg" />
          </div>
        </button>

        {captures.length > 0 ? (
          <motion.button
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={handleDone}
            className="flex flex-col items-center gap-1 group text-cameroon-yellow"
          >
            <div className="p-3 rounded-full bg-cameroon-green border border-cameroon-yellow/40 shadow-cameroon-glow">
              <CheckIcon className="h-6 w-6 text-cameroon-yellow" />
            </div>
            <span className="text-[10px] font-black tracking-wider">{t.done} ({captures.length})</span>
          </motion.button>
        ) : (
          <div className="w-12" />
        )}
      </footer>
    </div>
  );
};

export default Scanner;
