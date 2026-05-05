import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { CamDiagLogo } from '../components/ui/CamDiagLogo';
import { ShieldIcon, CameraIcon, ClipBoardIcon, BoltIcon, UsersIcon, MapPinIcon } from '../components/ui/Icons';

const CUSTOM_EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const getAuthErrorMessage = (err: unknown, fallback: string): string => {
  const code = typeof err === 'object' && err && 'code' in err
    ? String((err as { code?: unknown }).code)
    : '';

  if (code === 'auth/unauthorized-domain') {
    return 'This public link is not authorized for sign-in yet. Please use the official CamDiag test link or contact NDN Analytics.';
  }
  if (code === 'auth/popup-blocked') {
    return 'The Google sign-in popup was blocked. Please allow popups for this site and try again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was closed before it finished. Please try again.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled for this Firebase project yet.';
  }

  return err instanceof Error ? err.message : fallback;
};

const useAppearOnScroll = (delay = 0) => ({
  initial: { opacity: 0, y: 40, filter: 'blur(8px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-80px' as const },
  transition: { duration: 0.9, delay, ease: CUSTOM_EASE },
});

const StaggerContainer = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <div ref={ref} className={className}>
      {Array.isArray(children) ? children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 50, filter: 'blur(6px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, delay: i * 0.12, ease: CUSTOM_EASE }}
        >
          {child}
        </motion.div>
      )) : children}
    </div>
  );
};

const FloatingOrb = ({ color, size, top, left, delay = 0 }: { color: string; size: string; top: string; left: string; delay?: number }) => (
  <motion.div
    className={`absolute hidden md:block rounded-full ${size} ${color} blur-[100px] pointer-events-none`}
    style={{ top, left }}
    animate={{ y: [0, -30, 10, -20, 0], x: [0, 15, -10, 20, 0], scale: [1, 1.1, 0.95, 1.05, 1] }}
    transition={{ duration: 12, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

const Marquee = ({ children, speed = 30 }: { children: ReactNode; speed?: number }) => (
  <div className="overflow-hidden relative">
    <motion.div
      className="flex gap-8 whitespace-nowrap"
      animate={{ x: [0, '-50%'] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
    >
      {children}{children}
    </motion.div>
  </div>
);

const MagneticButton = ({ children, ...rest }: React.ComponentProps<typeof motion.button>) => {
  const ref = useRef<HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  return (
    <motion.button
      ref={ref}
      style={{ x, y, ...rest.style }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * 0.18);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.18);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      {...rest}
    >
      {children}
    </motion.button>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
   const { isAuthenticated, login, loginWithGoogle, register, loginWithPhone, confirmPhoneCode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<import('firebase/auth').ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);
   const heroRef = useRef(null);
   // Simplified animations to avoid scroll position issues
   const heroY = useMotionValue(0);
   const heroOpacity = useMotionValue(1);
   const heroScale = useMotionValue(1);

   const { scrollYProgress: pageScrollProgress } = useScroll();
   const scaleX = useSpring(pageScrollProgress, { stiffness: 100, damping: 30 });

    const closeModal = useCallback(() => {
      setShowLogin(false); setError(''); setOtpError('');
      setEmail(''); setPassword(''); setName('');
      setPhoneNumber(''); setOtp(''); setOtpSent(false);
      setConfirmationResult(null); setAuthMethod('email'); setAuthTab('login');
    }, []);

    useEffect(() => {
      if (isAuthenticated) {
        void navigate('/app');
      }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
      if (!showLogin) return undefined;
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') closeModal();
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }, [closeModal, showLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (authMethod === 'phone' && otpSent && confirmationResult) {
      try {
        await confirmPhoneCode(confirmationResult, otp);
        setShowLogin(false);
      } catch (err) {
        setOtpError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
      }
      return;
    }
    if (authMethod === 'phone') return;
    try {
      if (authTab === 'register') {
        await register(email, password, name || email.split('@')[0] || 'User');
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Authentication failed. Please try again.'));
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setOtpError('');
    if (!phoneNumber.trim()) { setError('Please enter a phone number'); return; }
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      setError('Please enter a valid phone number with country code (e.g., +237XXXXXXXXX).');
      return;
    }
    try {
      const result = await loginWithPhone(phoneNumber);
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Failed to send code. Please check your phone number.'));
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setOtpError('');
    try {
      await loginWithGoogle();
      setShowLogin(false);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Google sign-in failed. Please try again.'));
    }
  };

  const features = [
    {
      icon: <CameraIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Analyse par Scanner IA' : language === 'pcm' ? 'AI Scan Check' : 'AI Scan Analysis',
      desc: language === 'fr'
        ? 'Scannez des résultats de laboratoire, des radiographies et des tests RDT. Recevez une analyse assistée par IA en secondes.'
        : language === 'pcm'
        ? 'Scan lab result, X-ray, and RDT test. AI go give you check sharp sharp.'
        : 'Scan lab results, X-rays, and RDT tests. Get AI-assisted analysis in seconds.',
      gradient: 'from-cameroon-green to-cameroon-green-light',
      glow: 'shadow-cameroon-glow',
    },
    {
      icon: <ClipBoardIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Base de Données Médicamenteuse' : language === 'pcm' ? 'Drug Database' : 'Drug Database',
      desc: language === 'fr'
        ? 'Recherchez des médicaments disponibles au Cameroun. Vérifiez les interactions médicamenteuses avec MedGemma AI.'
        : language === 'pcm'
        ? 'Find drugs wey dey for Cameroon. Check drug interaction with MedGemma AI.'
        : 'Search medications available in Cameroon. Check drug interactions with MedGemma AI.',
      gradient: 'from-cameroon-red to-cameroon-red-light',
      glow: 'shadow-red-glow',
    },
    {
      icon: <ShieldIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Médecine Traditionnelle' : language === 'pcm' ? 'Local Contri-Medicine' : 'Local Contri-Medicine',
      desc: language === 'fr'
        ? 'Intègre les remèdes traditionnels du Cameroun avec la médecine moderne pour des soins holistiques.'
        : language === 'pcm'
        ? 'Join Cameroon local medicine with modern medicine for full body care.'
        : 'Integrates Cameroon traditional remedies with modern medicine for holistic care.',
      gradient: 'from-cameroon-yellow to-cameroon-yellow-deep',
      glow: 'shadow-sunset-glow',
    },
    {
      icon: <BoltIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Fonctionne Hors Ligne' : language === 'pcm' ? 'E Work Without Net' : 'Works Offline',
      desc: language === 'fr'
        ? 'Conçu pour les zones à faible bande passante. Les analyses locales fonctionnent sans internet.'
        : language === 'pcm'
        ? 'Build am for area where net no plenty. Local check dey work without internet.'
        : 'Built for low-bandwidth areas. Local analysis works without internet.',
      gradient: 'from-cameroon-green-deep to-cameroon-green',
      glow: 'shadow-cameroon-glow',
    },
    {
      icon: <UsersIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Trilingue EN/FR/Pidgin' : language === 'pcm' ? 'EN / FR / Pidgin' : 'Trilingual EN/FR/Pidgin',
      desc: language === 'fr'
        ? 'Interface complète en anglais, français et pidgin camerounais.'
        : language === 'pcm'
        ? 'Full interface for English, French and Cameroon Pidgin.'
        : 'Full English, French and Cameroon Pidgin interface — built for local healthcare.',
      gradient: 'from-cameroon-yellow to-cameroon-red',
      glow: 'shadow-sunset-glow',
    },
    {
      icon: <MapPinIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Cartographie en Direct' : language === 'pcm' ? 'Live Map' : 'Live Facility Map',
      desc: language === 'fr'
        ? 'Trouvez cliniques, hôpitaux et pharmacies à proximité grâce à Google Maps en temps réel.'
        : language === 'pcm'
        ? 'Find hospital, clinic and pharmacy wey dey near you with Google Maps.'
        : 'Find nearby clinics, hospitals, and pharmacies in real-time with Google Maps.',
      gradient: 'from-cameroon-red to-cameroon-yellow',
      glow: 'shadow-red-glow',
    },
  ];

  const stats = [
    { value: '12,842', label: language === 'fr' ? 'Utilisateurs Actifs' : 'Active Users' },
    { value: '94%', label: language === 'fr' ? 'Précision du Scan' : 'Scan Accuracy' },
    { value: '<1s', label: language === 'fr' ? 'Temps de Réponse' : 'Response Time' },
    { value: '24/7', label: language === 'fr' ? 'Disponibilité' : 'Uptime' },
  ];

  const testimonials = [
    {
      name: 'Dr. Kamga',
      role: language === 'fr' ? 'Médecin Généraliste, Yaoundé' : 'General Practitioner, Yaoundé',
      text: language === 'fr'
        ? 'CamDiag a transformé ma pratique. Je peux vérifier les interactions médicamenteuses en temps réel pendant les consultations.'
        : 'CamDiag has transformed my practice. I can verify drug interactions in real-time during consultations.',
    },
    {
      name: 'Dr. Ndi',
      role: language === 'fr' ? 'Pharmacien, Douala' : 'Pharmacist, Douala',
      text: language === 'fr'
        ? 'La base de données qui inclut les remèdes traditionnels est exactement ce dont nous avions besoin au Cameroun.'
        : 'The drug database that includes traditional remedies is exactly what we needed in Cameroon.',
    },
    {
      name: 'Marie T.',
      role: language === 'fr' ? 'Infirmière, Bamenda' : 'Nurse, Bamenda',
      text: language === 'fr'
        ? "Même dans les zones rurales sans internet, l'analyse locale fonctionne parfaitement."
        : 'Even in rural areas without internet, the local analysis works perfectly. It\'s a game-changer.',
    },
  ];

  return (
    <div className="screen-safe bg-cameroon-night text-white overflow-x-hidden">
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left bg-cameroon-flag"
        style={{ scaleX }}
      />

      {/* Floating ambient orbs — Cameroon palette */}
      <FloatingOrb color="bg-cameroon-green/30" size="w-[600px] h-[600px]" top="-20%" left="-10%" delay={0} />
      <FloatingOrb color="bg-cameroon-red/22" size="w-[500px] h-[500px]" top="20%" left="60%" delay={3} />
      <FloatingOrb color="bg-cameroon-yellow/18" size="w-[400px] h-[400px]" top="60%" left="20%" delay={6} />
      <FloatingOrb color="bg-cameroon-green-light/20" size="w-[350px] h-[350px]" top="80%" left="70%" delay={9} />

      {/* Nav */}
      <motion.nav
        aria-label="Main navigation"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: CUSTOM_EASE }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-2 min-[380px]:px-3 sm:px-5 md:px-12 py-3 sm:py-4 glass-dark"
      >
        <motion.div className="min-w-0 shrink" whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 400 }}>
          <CamDiagLogo size={36} animated showWordmark className="[&>div:last-child]:hidden min-[420px]:[&>div:last-child]:flex sm:[&>div:last-child]:flex" />
        </motion.div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          {[
            { label: language === 'fr' ? 'Fonctionnalités' : 'Features', href: '#features' },
            { label: language === 'fr' ? 'Témoignages' : 'Testimonials', href: '#testimonials' },
            { label: 'MedGemma AI', href: '#ai' },
          ].map((link) => (
            <motion.a key={link.href} href={link.href} className="hover:text-cameroon-yellow transition-colors" whileHover={{ y: -1 }}>
              {link.label}
            </motion.a>
          ))}
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3">
          <div className="flex bg-white/5 border border-white/10 rounded-full p-1 text-[10px] min-[380px]:text-[11px] sm:text-xs font-bold">
            <button onClick={() => setLanguage('en')} className={`${language === 'en' ? 'bg-cameroon-yellow text-cameroon-night shadow-sm' : 'text-white/40 hover:text-white/70'} min-h-8 px-1.5 min-[380px]:px-2 sm:px-3 py-1 rounded-full transition-all`}>EN</button>
            <button onClick={() => setLanguage('fr')} className={`${language === 'fr' ? 'bg-cameroon-yellow text-cameroon-night shadow-sm' : 'text-white/40 hover:text-white/70'} min-h-8 px-1.5 min-[380px]:px-2 sm:px-3 py-1 rounded-full transition-all`}>FR</button>
            <button onClick={() => setLanguage('pcm')} className={`${language === 'pcm' ? 'bg-cameroon-yellow text-cameroon-night shadow-sm' : 'text-white/40 hover:text-white/70'} min-h-8 px-1.5 min-[380px]:px-2 sm:px-3 py-1 rounded-full transition-all`}>Local</button>
          </div>
          <MagneticButton
            onClick={() => setShowLogin(true)}
            className="bg-cameroon-yellow text-cameroon-night font-black text-xs sm:text-sm px-2.5 min-[380px]:px-3 sm:px-5 py-2.5 rounded-full shadow-sunset-glow whitespace-nowrap"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            {t.login}
          </MagneticButton>
        </div>
      </motion.nav>

       {/* Hero */}
       <section ref={heroRef} className="relative z-10 px-4 sm:px-6 md:px-12 pt-28 sm:pt-36 pb-16 sm:pb-24 max-w-6xl mx-auto text-center min-h-[560px]">
         <motion.div style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}>
          {/* Hero 3D Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.1, ease: CUSTOM_EASE }}
            className="flex justify-center mb-8"
          >
            <CamDiagLogo size={180} animated />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.3, ease: CUSTOM_EASE }}
            className="inline-flex items-center gap-2 bg-white/[0.04] border border-cameroon-yellow/20 rounded-full px-5 py-2.5 mb-10 text-sm backdrop-blur-sm"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-cameroon-yellow"
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-white/70">{language === 'fr' ? 'Propulsé par Google MedGemma' : language === 'pcm' ? 'Powered by Google MedGemma' : 'Powered by Google MedGemma'}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.4, ease: CUSTOM_EASE }}
            className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black leading-[0.98] mb-6 sm:mb-8 font-display"
          >
            <span className="text-gradient-cameroon inline-block">
              {language === 'fr' ? 'Revue IA' : language === 'pcm' ? 'AI Review' : 'AI Clinical Review'}
            </span>
            <br />
            <span className="text-white/95">
              {language === 'fr' ? 'pour le Cameroun' : language === 'pcm' ? 'for Cameroon' : 'for Cameroon'}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.55, ease: CUSTOM_EASE }}
            className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 sm:mb-14 leading-relaxed"
          >
            {language === 'fr'
              ? 'Assistance diagnostique par IA pour les professionnels de santé du Cameroun. Scannez, analysez et traitez — avec ou sans internet.'
              : language === 'pcm'
              ? 'AI diagnosis support for health workers for Cameroon. Scan, check, treat — with or without internet.'
              : 'AI-assisted clinical review for Cameroon healthcare professionals. Scan documents, review possible findings, and support clinician decisions.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.7, ease: CUSTOM_EASE }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4"
          >
            <MagneticButton
              onClick={() => setShowLogin(true)}
              className="bg-cameroon-yellow text-cameroon-night font-black text-base sm:text-lg px-8 sm:px-10 py-4 rounded-full shadow-sunset-glow flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              {language === 'fr' ? 'Commencer Gratuitement' : language === 'pcm' ? 'Start For Free' : 'Get Started Free'}
              <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </motion.svg>
            </MagneticButton>
            <MagneticButton
              onClick={() => navigate('/demo')}
              className="bg-white/[0.06] border border-cameroon-green/30 text-white font-bold text-base sm:text-lg px-8 sm:px-10 py-4 rounded-full backdrop-blur-sm"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(0, 122, 94, 0.15)' }}
              whileTap={{ scale: 0.97 }}
            >
              {language === 'fr' ? 'Voir la Démo' : language === 'pcm' ? 'See Demo' : 'View Demo'}
            </MagneticButton>
          </motion.div>
        </motion.div>

        {/* Hero Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.9, ease: CUSTOM_EASE }}
          className="mt-24 relative"
        >
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-cameroon-yellow/15 rounded-3xl p-4 md:p-8 backdrop-blur-md shadow-premium">
              <div className="bg-cameroon-night/95 rounded-2xl p-5 md:p-8 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-cameroon-red/60" />
                    <div className="w-3 h-3 rounded-full bg-cameroon-yellow/60" />
                    <div className="w-3 h-3 rounded-full bg-cameroon-green/70" />
                  </div>
                  <span className="text-xs text-white/30 font-mono">camdiag.app</span>
                  <span className="ml-auto text-[9px] bg-cameroon-yellow/20 text-cameroon-yellow px-2 py-0.5 rounded-full font-black uppercase tracking-wider">MedGemma</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-4">
                    <motion.div
                      className="bg-cameroon-green/15 border border-cameroon-green/25 rounded-xl p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.5, duration: 0.6 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div className="w-2 h-2 rounded-full bg-cameroon-yellow" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                        <span className="text-xs font-black text-cameroon-yellow uppercase tracking-wider">AI Active</span>
                      </div>
                      <p className="text-white font-black text-lg">Malaria (P. Falciparum)</p>
                      <div className="flex gap-2 mt-2">
                        <span className="bg-cameroon-red/20 text-cameroon-red-light text-[10px] font-black px-2 py-0.5 rounded">94% Match</span>
                        <span className="bg-cameroon-yellow/20 text-cameroon-yellow text-[10px] font-black px-2 py-0.5 rounded">Low Hematocrit</span>
                      </div>
                    </motion.div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Hematocrit', value: '32%', tag: 'Low', color: 'text-cameroon-yellow' },
                        { label: 'Parasites', value: '2500/µL', tag: 'High', color: 'text-cameroon-red-light' },
                      ].map((m, i) => (
                        <motion.div
                          key={m.label}
                          className="bg-white/5 rounded-xl p-3 border border-white/5"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.8 + i * 0.2, duration: 0.5 }}
                        >
                          <p className="text-[10px] text-white/30 uppercase font-black tracking-wider">{m.label}</p>
                          <p className="text-xl font-black text-white">{m.value}</p>
                          <p className={`text-[10px] font-black ${m.color}`}>{m.tag}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Prescribed', name: 'Coartem', tag: 'Antimalarial', accent: 'bg-cameroon-green/10 border-cameroon-green/30 text-cameroon-green-light', delay: 1.7 },
                      { label: 'Contri-medicine', name: 'Artemisia Tea', tag: 'Traditional', accent: 'bg-cameroon-yellow/10 border-cameroon-yellow/30 text-cameroon-yellow', delay: 1.9 },
                      { label: 'Safety Alert', name: 'Coartem + Quinine conflict', tag: '', accent: 'bg-cameroon-red/15 border-cameroon-red/40 text-cameroon-red-light', delay: 2.1 },
                    ].map((item) => (
                      <motion.div
                        key={item.label}
                        className={`${item.accent} border rounded-xl p-3`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: item.delay, duration: 0.5 }}
                      >
                        <p className="text-[10px] font-black uppercase mb-1 tracking-wider">{item.label}</p>
                        <p className="text-sm font-black text-white">{item.name}</p>
                        {item.tag && <p className="text-[10px] text-white/40">{item.tag}</p>}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cameroon-green/20 blur-3xl rounded-full"
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </section>

      {/* Cameroon flag accent strip */}
      <div className="h-[3px] bg-cameroon-flag opacity-50 my-4 max-w-6xl mx-auto rounded-full" />

      {/* Hospitals marquee */}
      <section className="relative z-10 py-12 border-y border-white/[0.04] overflow-hidden">
        <p className="text-center text-xs text-cameroon-yellow/60 uppercase tracking-[0.25em] font-black mb-8">
          {language === 'fr' ? 'Utilisé dans les établissements de santé du Cameroun' : language === 'pcm' ? 'Cameroon hospital dem dey use am' : 'Trusted across Cameroon healthcare facilities'}
        </p>
        <Marquee speed={35}>
          {[
            'Yaoundé Central Hospital', 'Hôpital Général de Douala',
            'Bamenda Regional Hospital', 'Centre Hospitalier Universitaire',
            'Waspito Telehealth', 'MedPlus Pharmacy',
            'Green Cross Pharma', 'Hôpital Laquintinie',
          ].map((name) => (
            <span key={name} className="text-white/25 text-sm font-bold px-6">{name}</span>
          ))}
        </Marquee>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <StaggerContainer className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <motion.p
                className="text-5xl md:text-6xl font-black text-gradient-cameroon font-display"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {stat.value}
              </motion.p>
              <p className="text-sm text-white/40 font-bold mt-3 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </StaggerContainer>
      </section>

      {/* Features */}
      <section id="features" aria-labelledby="features-heading" className="relative z-10 px-6 md:px-12 py-24 max-w-6xl mx-auto">
        <motion.div {...useAppearOnScroll()} className="text-center mb-20">
          <p className="text-sm font-black text-cameroon-yellow uppercase tracking-[0.25em] mb-5">
            {language === 'fr' ? 'Fonctionnalités' : language === 'pcm' ? 'Wetin E Dey Do' : 'Features'}
          </p>
          <h2 id="features-heading" className="text-5xl md:text-6xl font-black font-display">
            {language === 'fr' ? 'Conçu pour le terrain' : language === 'pcm' ? 'Build For Ground' : 'Built for the field'}
          </h2>
          <p className="text-white/40 text-lg mt-6 max-w-xl mx-auto leading-relaxed">
            {language === 'fr'
              ? 'Des outils de diagnostic conçus pour les réalités du terrain au Cameroun.'
              : language === 'pcm'
              ? 'Clinical review tools wey we build for Cameroon real-life work.'
              : 'Diagnostic tools designed for the realities of healthcare in Cameroon.'}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 60, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: CUSTOM_EASE }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={`group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-7 hover:bg-white/[0.05] hover:border-cameroon-yellow/20 transition-all duration-500 hover:${feature.glow}`}
            >
              <motion.div
                className={`bg-gradient-to-br ${feature.gradient} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg`}
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                transition={{ duration: 0.4 }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-xl font-black text-white mb-3">{feature.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Section */}
      <section id="ai" aria-labelledby="ai-heading" className="relative z-10 px-6 md:px-12 py-28">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -60, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease: CUSTOM_EASE }}
          >
            <motion.p
              className="text-sm font-black text-cameroon-red-light uppercase tracking-[0.25em] mb-5"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              Google MedGemma
            </motion.p>
            <h2 id="ai-heading" className="text-5xl md:text-6xl font-black mb-6 font-display">
              {language === 'fr' ? 'IA de' : language === 'pcm' ? 'Medical' : 'Medical-Grade'}{' '}
              <span className="text-gradient-cameroon">
                {language === 'fr' ? 'Qualité Médicale' : language === 'pcm' ? 'AI Power' : 'AI Power'}
              </span>
            </h2>
            <p className="text-white/45 text-lg leading-relaxed mb-10">
              {language === 'fr'
                ? "Intégré avec MedGemma de Google, CamDiag fournit une analyse d'image médicale, une vérification des interactions médicamenteuses et des informations sur les médicaments — le tout par IA."
                : language === 'pcm'
                ? "We use Google MedGemma. CamDiag fit check medical picture, drug interaction, and drug info — all with AI."
                : "Integrated with Google's MedGemma, CamDiag delivers medical image analysis, drug interaction checking, and medication info — all AI-powered."}
            </p>
            <StaggerContainer className="space-y-5">
              {[
                language === 'fr' ? "Analyse d'image médicale en temps réel" : 'Real-time medical image analysis',
                language === 'fr' ? "Détection d'interactions médicamenteuses" : 'Drug interaction detection',
                language === 'fr' ? 'Recherche de médicaments adaptée au Cameroun' : 'Cameroon-specific medication search',
                language === 'fr' ? 'Moteur local de secours hors ligne' : 'Offline fallback local engine',
              ].map((item) => (
                <div key={item} className="flex items-center gap-4">
                  <motion.div
                    className="w-7 h-7 rounded-full bg-cameroon-yellow/15 flex items-center justify-center shrink-0 border border-cameroon-yellow/30"
                    whileInView={{ scale: [0.8, 1] }}
                    viewport={{ once: true }}
                  >
                    <svg className="w-3.5 h-3.5 text-cameroon-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </motion.div>
                  <span className="text-sm text-white/65 font-medium">{item}</span>
                </div>
              ))}
            </StaggerContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease: CUSTOM_EASE }}
            className="relative"
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
              <div className="bg-gradient-to-br from-cameroon-red/[0.10] to-cameroon-yellow/[0.06] border border-cameroon-yellow/20 rounded-3xl p-8 backdrop-blur-md shadow-premium">
                <div className="flex items-center gap-3 mb-8">
                  <motion.div className="w-3 h-3 rounded-full bg-cameroon-yellow" animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                  <span className="text-xs font-black text-cameroon-yellow uppercase tracking-[0.2em]">MedGemma AI</span>
                </div>
                <div className="space-y-5">
                  <motion.div
                    className="bg-cameroon-night/60 rounded-xl p-5 border border-white/[0.06]"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                  >
                     <p className="text-[10px] text-white/25 mb-2 uppercase tracking-widest">Prompt</p>
                      <p className="text-sm text-white/55 font-mono">Analyze this malaria RDT scan&#46;&#46;&#46;</p>
                  </motion.div>
                  <motion.div className="flex justify-center" animate={{ y: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <svg className="w-7 h-7 text-cameroon-yellow/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  </motion.div>
                  <motion.div
                    className="bg-cameroon-night/60 rounded-xl p-5 border border-cameroon-yellow/15"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                  >
                    <p className="text-[10px] text-cameroon-yellow mb-3 font-black uppercase tracking-widest">Response</p>
                    <div className="space-y-3">
                      {[
                        { badge: '94%', tone: 'bg-cameroon-green/20 text-cameroon-green-light', text: 'Malaria (P. Falciparum)' },
                        { badge: 'RX', tone: 'bg-cameroon-yellow/20 text-cameroon-yellow', text: 'Coartem recommended' },
                        { badge: '!', tone: 'bg-cameroon-red/25 text-cameroon-red-light', text: 'Coartem + Quinine conflict' },
                      ].map((item, i) => (
                        <motion.div
                          key={item.text}
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 1.0 + i * 0.15 }}
                        >
                          <span className={`${item.tone} text-[10px] font-black px-2 py-0.5 rounded shrink-0`}>{item.badge}</span>
                          <span className="text-sm text-white/75">{item.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-1/2 h-20 bg-cameroon-yellow/20 blur-3xl rounded-full"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" aria-labelledby="testimonials-heading" className="relative z-10 px-6 md:px-12 py-28 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <motion.div {...useAppearOnScroll()} className="text-center mb-20">
            <p className="text-sm font-black text-cameroon-yellow uppercase tracking-[0.25em] mb-5">
              {language === 'fr' ? 'Témoignages' : language === 'pcm' ? 'Wetin Doctor Dem Talk' : 'Testimonials'}
            </p>
            <h2 id="testimonials-heading" className="text-5xl md:text-6xl font-black font-display">
              {language === 'fr' ? 'Approuvé par les soignants' : language === 'pcm' ? 'Doctor Dem Trust Am' : 'Trusted by clinicians'}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 60, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: CUSTOM_EASE }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-7 hover:bg-white/[0.05] hover:border-cameroon-yellow/20 transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-cameroon-green to-cameroon-yellow flex items-center justify-center text-cameroon-night text-sm font-black shadow-cameroon-glow"
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  >
                    {item.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                  </motion.div>
                  <div>
                    <p className="text-sm font-black text-white">{item.name}</p>
                    <p className="text-xs text-white/35">{item.role}</p>
                  </div>
                </div>
                 <p className="text-sm text-white/55 leading-relaxed italic">&quot;{item.text}&quot;</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-12 py-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1, ease: CUSTOM_EASE }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-gradient-to-b from-cameroon-green/[0.08] to-cameroon-yellow/[0.04] border border-cameroon-yellow/20 rounded-[2rem] p-12 md:p-20 relative overflow-hidden">
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ background: [
                'linear-gradient(135deg, rgba(0,122,94,0.10), transparent, rgba(252,209,22,0.10))',
                'linear-gradient(135deg, rgba(206,17,38,0.10), transparent, rgba(0,122,94,0.10))',
                'linear-gradient(135deg, rgba(252,209,22,0.10), transparent, rgba(206,17,38,0.10))',
                'linear-gradient(135deg, rgba(0,122,94,0.10), transparent, rgba(252,209,22,0.10))',
              ] }}
              transition={{ duration: 12, repeat: Infinity }}
            />
            <div className="relative z-10">
              <div className="flex justify-center mb-8">
                <CamDiagLogo size={120} animated />
              </div>
              <motion.h2
                className="text-5xl md:text-6xl font-black mb-5 font-display"
                whileInView={{ opacity: [0, 1], y: [30, 0] }}
                viewport={{ once: true }}
              >
                {language === 'fr' ? 'Prêt à commencer ?' : language === 'pcm' ? 'You Ready?' : 'Ready to start?'}
              </motion.h2>
              <p className="text-white/45 text-lg mb-10">
                {language === 'fr'
                  ? 'Rejoignez des milliers de professionnels de santé qui utilisent CamDiag au Cameroun.'
                  : language === 'pcm'
                  ? 'Join plenty health workers wey dey use CamDiag for Cameroon.'
                  : 'Join thousands of healthcare professionals using CamDiag in Cameroon.'}
              </p>
              <MagneticButton
                onClick={() => setShowLogin(true)}
                className="bg-cameroon-yellow text-cameroon-night font-black text-lg px-12 py-5 rounded-full shadow-sunset-glow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                {language === 'fr' ? 'Commencer Gratuitement' : language === 'pcm' ? 'Start For Free' : 'Get Started Free'}
              </MagneticButton>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-12 py-12 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <CamDiagLogo size={32} showWordmark />
          <p className="text-xs text-white/30 text-center max-w-md">
            {language === 'fr'
              ? "© 2026 CamDiag par NDN Analytics. Ceci n'est PAS un vrai diagnostic. Consultez toujours un médecin."
              : language === 'pcm'
              ? '© 2026 CamDiag by NDN Analytics. Dis no be real diagnosis. Always meet doctor.'
              : '© 2026 CamDiag by NDN Analytics. This is NOT a real diagnosis. Always consult a doctor.'}
          </p>
          <div className="flex items-center gap-6 text-sm text-white/35">
            <a href="#" className="hover:text-cameroon-yellow transition-colors">{language === 'fr' ? 'Confidentialité' : 'Privacy'}</a>
            <a href="#" className="hover:text-cameroon-yellow transition-colors">{language === 'fr' ? 'Conditions' : 'Terms'}</a>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] glass-dark flex items-start sm:items-center justify-center overflow-y-auto px-4 py-5 sm:p-6"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0, filter: 'blur(10px)' }}
            animate={{ scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ duration: 0.4, ease: CUSTOM_EASE }}
            className="my-auto bg-cameroon-night/95 border border-cameroon-yellow/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-md max-h-[calc(100dvh-2.5rem)] overflow-y-auto shadow-premium"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <CamDiagLogo size={42} animated />
              <motion.button onClick={closeModal} className="text-white/40 hover:text-white transition-colors" whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </motion.button>
            </div>
            <h2 className="text-2xl font-black mt-3">{authTab === 'register' ? (language === 'fr' ? 'Créer un compte' : 'Create Account') : t.welcome_back}</h2>
            <p className="text-white/40 text-sm mb-6">{authTab === 'register' ? (language === 'fr' ? 'Rejoignez CamDiag pour accéder au diagnostic IA' : 'Join CamDiag to access AI diagnostics') : t.login_subtitle}</p>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-cameroon-red/10 border border-cameroon-red/30 text-cameroon-red-light text-sm rounded-xl px-4 py-2 mb-4">
                {error}
              </motion.div>
            )}

            <div className="flex bg-white/[0.04] rounded-xl p-1 mb-4">
              <button
                type="button"
                onClick={() => { setAuthMethod('email'); setError(''); setOtpError(''); setOtpSent(false); setConfirmationResult(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-black transition-all ${authMethod === 'email' ? 'bg-cameroon-green text-white' : 'text-white/40 hover:text-white'}`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('phone'); setError(''); setOtpError(''); setOtpSent(false); setConfirmationResult(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-black transition-all ${authMethod === 'phone' ? 'bg-cameroon-green text-white' : 'text-white/40 hover:text-white'}`}
              >
                {language === 'fr' ? 'Téléphone' : 'Phone'}
              </button>
            </div>

            {authMethod === 'phone' ? (
              otpSent ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-white/60 text-sm">{t.otp_sent}</p>
                    <p className="text-white font-bold text-sm mt-1">{phoneNumber}</p>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    aria-label={t.enter_otp}
                    placeholder={t.otp_placeholder}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-center text-2xl tracking-widest placeholder:text-white/20 focus:border-cameroon-yellow/50 outline-none transition-all"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  {otpError && <p className="text-cameroon-red-light text-sm text-center">{otpError}</p>}
                  <motion.button
                    type="submit"
                    disabled={otp.length !== 6}
                    className="w-full bg-cameroon-yellow text-cameroon-night font-black py-3.5 rounded-xl transition-all disabled:opacity-50"
                    whileTap={{ scale: 0.98 }}
                  >
                    {t.verify_otp}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); setOtpError(''); setConfirmationResult(null); }}
                    className="w-full text-white/40 text-sm hover:text-white/60 transition-colors py-1"
                  >
                    {t.use_phone_instead}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <input
                    type="tel"
                    aria-label={t.phone_number}
                    placeholder={t.phone_placeholder}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-cameroon-yellow/50 outline-none transition-all"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                   <motion.button
                     type="submit"
                     className="w-full bg-cameroon-yellow text-cameroon-night font-black py-3.5 rounded-xl transition-all"
                     whileHover={{ boxShadow: '0 0 40px rgba(252,209,22,0.4)' }}
                     whileTap={{ scale: 0.98 }}
                   >
                     {t.send_otp}
                   </motion.button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('email')}
                    className="w-full text-white/40 text-sm hover:text-white/60 transition-colors"
                  >
                    {t.use_email_instead}
                  </button>
                </form>
              )
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full min-h-12 bg-white text-cameroon-night font-black rounded-xl flex items-center justify-center gap-3 border border-white/80 shadow-sm active:scale-[0.98] transition-all"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-lg font-black text-cameroon-green border border-slate-200">G</span>
                  <span>{t.continue_with_google}</span>
                </button>
                <div className="flex items-center gap-3 text-white/30 text-xs font-bold uppercase tracking-wider">
                  <span className="h-px flex-1 bg-white/10" />
                  <span>{t.or_continue_with_email}</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                {authTab === 'register' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <input
                      type="text"
                      aria-label="Name"
                      placeholder={language === 'fr' ? 'Votre nom' : 'Your name'}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-cameroon-yellow/50 outline-none transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={authTab === 'register'}
                    />
                  </motion.div>
                )}
                <input
                  type="email"
                  aria-label="Email"
                  placeholder={t.email_placeholder}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-cameroon-yellow/50 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  aria-label="Password"
                  placeholder={t.password_placeholder}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-cameroon-yellow/50 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                 <motion.button
                   type="submit"
                   className="w-full bg-cameroon-yellow text-cameroon-night font-black py-3.5 rounded-xl transition-all"
                   whileHover={{ boxShadow: '0 0 40px rgba(252,209,22,0.4)' }}
                   whileTap={{ scale: 0.98 }}
                 >
                   {(authTab === 'register' ? (language === 'fr' ? 'Créer le compte' : 'Create Account') : t.login)}
                 </motion.button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('phone')}
                  className="w-full text-white/40 text-sm hover:text-white/60 transition-colors"
                >
                  {t.or_continue_with_phone}
                </button>
              </form>
            )}

            {/* Disclaimer in modal — required medical context before sign-up */}
            <p className="mt-4 text-[10px] text-cameroon-yellow/70 text-center leading-relaxed bg-cameroon-yellow/5 border border-cameroon-yellow/15 rounded-xl px-3 py-2">
              {language === 'fr'
                ? '⚠️ CamDiag est un outil d\'aide à la décision. Ce n\'est pas un substitut au jugement clinique d\'un médecin agréé.'
                : language === 'pcm'
                ? '⚠️ CamDiag na helper for decision. E no fit replace doctor wey get license.'
                : '⚠️ CamDiag is decision-support only. Not a substitute for the judgment of a licensed clinician.'}
            </p>

            <div className="mt-4 text-center space-y-3">
              {authMethod === 'email' && (
                <button
                  onClick={() => { setAuthTab(authTab === 'register' ? 'login' : 'register'); setError(''); }}
                  className="text-white/40 text-sm hover:text-white/60 transition-colors"
                >
                  {authTab === 'register'
                    ? (language === 'fr' ? 'Déjà un compte ? Se connecter' : 'Already have an account? Log in')
                    : (language === 'fr' ? 'Pas de compte ? Créer un compte' : "Don't have an account? Sign up")}
                </button>
              )}
                 <br />
                     <button
                       onClick={async () => {
                         closeModal();
                         void navigate('/demo');
                       }}
                       className="text-white/30 text-sm hover:text-cameroon-yellow transition-colors"
                     >
                  {language === 'fr' ? 'Continuer sans compte →' : language === 'pcm' ? 'Enter without account →' : 'Continue without account →'}
                </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* reCAPTCHA container for phone auth */}
      <div id="recaptcha-container" />

    </div>
  );
};

export default Landing;
