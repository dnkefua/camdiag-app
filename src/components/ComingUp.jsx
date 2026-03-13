import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ComingUp = ({ onBack, t }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: 'The CamDiag Vision',
      subtitle: 'Accessible Healthcare for Everyone',
      content: 'We are bringing lab-grade diagnostic power directly to the pockets of millions across Africa. Powered by cutting-edge AI and built for low-bandwidth environments.',
      gradient: 'from-blue-600 to-indigo-900',
      icon: (
        <svg className="w-16 h-16 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      )
    },
    {
      id: 2,
      title: 'Coming Next: IoT Integration',
      subtitle: 'Connecting Wearables & Smart Devices',
      content: 'Soon, CamDiag will sync directly with smartwatches and IoT health monitors to provide real-time blood pressure, pulse, and oxygen saturation overlays dynamically.',
      gradient: 'from-emerald-500 to-teal-800',
      icon: (
        <svg className="w-16 h-16 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
      )
    },
    {
      id: 3,
      title: 'Blockchain Medical Records',
      subtitle: 'Secure, Anonymous, Decentralized',
      content: 'Your health data belongs to you. We are implementing Web3 protocols to ensure your diagnostic history is tamper-proof and strictly under your control.',
      gradient: 'from-purple-600 to-fuchsia-900',
      icon: (
        <svg className="w-16 h-16 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
      )
    }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <div className="bg-black min-h-screen text-white font-sans flex flex-col relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[100px]"></div>
      </div>

      <header className="relative z-20 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 active:scale-95 transition-transform">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        </button>
        <h1 className="text-sm font-bold tracking-widest uppercase opacity-80">{t.coming_up_title || 'Coming Up'}</h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <main className="flex-grow flex items-center justify-center p-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.4 }}
            className={`w-full max-w-sm aspect-[3/4] rounded-[2.5rem] bg-gradient-to-br ${slides[currentSlide].gradient} p-8 flex flex-col justify-between shadow-2xl border border-white/10`}
          >
            <div className="space-y-6">
              <div className="bg-white/10 w-fit p-4 rounded-3xl backdrop-blur-md border border-white/20">
                {slides[currentSlide].icon}
              </div>
              <div>
                <h2 className="text-3xl font-black leading-tight mb-2 tracking-tight">{slides[currentSlide].title}</h2>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/70">{slides[currentSlide].subtitle}</h3>
              </div>
            </div>
            
            <p className="text-lg leading-relaxed font-medium text-white/90">
              {slides[currentSlide].content}
            </p>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-20 pb-10 px-6 flex items-center justify-between">
        <button onClick={prevSlide} className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        
        <div className="flex gap-3 text-sm font-bold tracking-widest uppercase text-white/50">
          Slide {currentSlide + 1} / {slides.length}
        </div>

        <button onClick={nextSlide} className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </footer>
    </div>
  );
};

export default ComingUp;
