import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { trackEvent } from '../services/analytics';
import { AlertIcon, BackIcon, CameraIcon, CheckIcon } from './ui/Icons';

const DemoScanner = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();

  const copy = {
    title: language === 'fr' ? 'Demo CamDiag' : language === 'pcm' ? 'CamDiag Demo' : 'CamDiag Demo',
    subtitle: language === 'fr'
      ? 'Parcours de demonstration sans IA et sans donnees medicales.'
      : language === 'pcm'
      ? 'Demo flow only. No AI call, no medical data upload.'
      : 'Demo flow only. No AI call and no medical data upload.',
    scan: language === 'fr' ? 'Simuler un scan' : language === 'pcm' ? 'Try Demo Scan' : 'Try Demo Scan',
    result: language === 'fr'
      ? 'Exemple: document medical detecte. Connectez-vous pour une analyse securisee.'
      : language === 'pcm'
      ? 'Sample: medical document found. Sign in for secure analysis.'
      : 'Sample: medical document detected. Sign in for secure analysis.',
    signIn: language === 'fr' ? 'Se connecter pour analyser' : language === 'pcm' ? 'Sign in for AI' : 'Sign in for AI analysis',
  };

  const handleDemo = () => {
    trackEvent('demo_scan_preview');
  };

  return (
    <div className="min-h-screen bg-cameroon-night text-white flex flex-col">
      <header className="px-5 py-4 flex items-center gap-3 border-b border-white/10">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate('/')}
          className="p-2 rounded-full bg-white/10 text-white"
        >
          <BackIcon />
        </button>
        <div>
          <h1 className="text-xl font-black">{copy.title}</h1>
          <p className="text-xs text-cameroon-yellow/80 font-semibold">{copy.subtitle}</p>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center justify-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm aspect-[3/4] rounded-[2rem] border-2 border-cameroon-yellow/40 bg-gradient-to-br from-slate-900 to-cameroon-green-deep shadow-premium relative overflow-hidden"
        >
          <div className="absolute inset-6 border border-white/20 rounded-2xl" />
          <div className="absolute inset-x-10 top-20 h-20 rounded-xl bg-white/10 border border-white/15" />
          <div className="absolute inset-x-10 top-48 space-y-3">
            <div className="h-3 rounded bg-white/25" />
            <div className="h-3 rounded bg-white/15 w-4/5" />
            <div className="h-3 rounded bg-white/15 w-2/3" />
          </div>
          <motion.div
            className="absolute left-8 right-8 h-1 bg-cameroon-yellow shadow-sunset-glow"
            animate={{ top: ['18%', '78%', '18%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute bottom-8 left-8 right-8 flex items-center gap-3 rounded-2xl bg-black/30 border border-white/10 p-4">
            <CheckIcon className="w-6 h-6 text-cameroon-yellow" />
            <p className="text-sm font-bold">{copy.result}</p>
          </div>
        </motion.div>

        <div className="w-full max-w-sm space-y-3">
          <button
            type="button"
            onClick={handleDemo}
            className="w-full bg-cameroon-yellow text-cameroon-night font-black py-4 rounded-2xl shadow-sunset-glow flex items-center justify-center gap-2"
          >
            <CameraIcon className="w-5 h-5" />
            {copy.scan}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/15"
          >
            {copy.signIn}
          </button>
          <p className="text-xs text-white/50 leading-relaxed flex gap-2">
            <AlertIcon className="w-4 h-4 shrink-0 text-cameroon-yellow" />
            {copy.subtitle}
          </p>
        </div>
      </main>
    </div>
  );
};

export default DemoScanner;
