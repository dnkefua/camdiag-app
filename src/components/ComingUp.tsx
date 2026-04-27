import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { BackIcon, GlobeIcon, DeviceIcon, LockIcon } from '../components/ui/Icons';

const ComingUp = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: 'The CamDiag Vision',
      subtitle: 'Accessible Healthcare for Everyone',
      content: 'We are bringing lab-grade diagnostic power directly to the pockets of millions across Africa. Powered by cutting-edge AI and built for low-bandwidth environments.',
      gradient: 'from-blue-600 to-indigo-900',
      icon: <GlobeIcon />,
    },
    {
      id: 2,
      title: 'Coming Next: IoT Integration',
      subtitle: 'Connecting Wearables & Smart Devices',
      content: 'Soon, CamDiag will sync directly with smartwatches and IoT health monitors to provide real-time blood pressure, pulse, and oxygen saturation overlays dynamically.',
      gradient: 'from-emerald-500 to-teal-800',
      icon: <DeviceIcon />,
    },
    {
      id: 3,
      title: 'Blockchain Medical Records',
      subtitle: 'Secure, Anonymous, Decentralized',
      content: 'Your health data belongs to you. We are implementing Web3 protocols to ensure your diagnostic history is tamper-proof and strictly under your control.',
      gradient: 'from-purple-600 to-fuchsia-900',
      icon: <LockIcon />,
    },
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <div className="bg-black min-h-screen text-white font-sans flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[100px]"></div>
      </div>

      <header className="relative z-20 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/app')} aria-label="Back" className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 active:scale-95 transition-transform">
          <BackIcon />
        </button>
        <h1 className="text-sm font-bold tracking-widest uppercase opacity-80">{t.coming_up_title}</h1>
        <div className="w-10"></div>
      </header>

      <main aria-labelledby="comingup-heading" className="flex-grow flex items-center justify-center p-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.4 }}
            className={`w-full max-w-sm aspect-[3/4] rounded-[2.5rem] bg-gradient-to-br ${slides[currentSlide]?.gradient} p-8 flex flex-col justify-between shadow-2xl border border-white/10`}
          >
            <div className="space-y-6">
              <div className="bg-white/10 w-fit p-4 rounded-3xl backdrop-blur-md border border-white/20">
                {slides[currentSlide]?.icon}
              </div>
              <div>
                <h2 id="comingup-heading" className="text-3xl font-black leading-tight mb-2 tracking-tight">{slides[currentSlide]?.title}</h2>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/70">{slides[currentSlide]?.subtitle}</h3>
              </div>
            </div>

            <p className="text-lg leading-relaxed font-medium text-white/90">
              {slides[currentSlide]?.content}
            </p>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-20 pb-10 px-6 flex items-center justify-between">
        <button onClick={prevSlide} aria-label="Previous slide" className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
          <BackIcon />
        </button>
        <div className="flex gap-3 text-sm font-bold tracking-widest uppercase text-white/50">
          Slide {currentSlide + 1} / {slides.length}
        </div>
        <button onClick={nextSlide} aria-label="Next slide" className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      </footer>
    </div>
  );
};

export default ComingUp;