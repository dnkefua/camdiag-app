import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { ShieldIcon, CameraIcon, ClipBoardIcon, BoltIcon, UsersIcon, SearchIcon } from '../components/ui/Icons';

const CUSTOM_EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

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
          transition={{ duration: 0.8, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {child}
        </motion.div>
      )) : children}
    </div>
  );
};

const FloatingOrb = ({ color, size, top, left, delay = 0 }: { color: string; size: string; top: string; left: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full ${size} ${color} blur-[100px] pointer-events-none`}
    style={{ top, left }}
    animate={{
      y: [0, -30, 10, -20, 0],
      x: [0, 15, -10, 20, 0],
      scale: [1, 1.1, 0.95, 1.05, 1],
    }}
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

const Landing = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const { isAuthenticated, login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const springHeroY = useSpring(heroY, { stiffness: 100, damping: 30 });

  useEffect(() => {
    if (isAuthenticated) navigate('/app');
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const features = [
    {
      icon: <CameraIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Analyse par Scanner IA' : 'AI Scan Analysis',
      desc: language === 'fr'
        ? 'Scannez des résultats de laboratoire, des radiographies et des tests RDT. Recevez une analyse assistée par IA en secondes.'
        : 'Scan lab results, X-rays, and RDT tests. Get AI-assisted analysis in seconds.',
      gradient: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/20',
    },
    {
      icon: <ClipBoardIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Base de Données Médicamenteuse' : 'Drug Database',
      desc: language === 'fr'
        ? 'Recherchez des médicaments disponibles au Cameroun. Vérifiez les interactions médicamenteuses avec MedGemma AI.'
        : 'Search medications available in Cameroon. Check drug interactions with MedGemma AI.',
      gradient: 'from-blue-500 to-indigo-600',
      glow: 'shadow-blue-500/20',
    },
    {
      icon: <ShieldIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Contri-Médecine Locale' : 'Local Contri-Medicine',
      desc: language === 'fr'
        ? 'Intègre les remèdes traditionnels du Cameroun avec la médecine moderne pour des soins holistiques.'
        : 'Integrates Cameroon traditional remedies with modern medicine for holistic care.',
      gradient: 'from-cameroon-green to-emerald-600',
      glow: 'shadow-cameroon-green/20',
    },
    {
      icon: <BoltIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Fonctionne Hors Ligne' : 'Works Offline',
      desc: language === 'fr'
        ? 'Conçu pour les zones à faible bande passante. Les analyses locales fonctionnent sans internet.'
        : 'Built for low-bandwidth areas. Local analysis works without internet.',
      gradient: 'from-amber-500 to-orange-600',
      glow: 'shadow-amber-500/20',
    },
    {
      icon: <UsersIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Bilingue EN/FR' : 'Bilingual EN/FR',
      desc: language === 'fr'
        ? 'Interface complète en anglais et français, conçu pour les professionnels de santé du Cameroun.'
        : 'Full English and French interface, designed for Cameroon healthcare professionals.',
      gradient: 'from-purple-500 to-fuchsia-600',
      glow: 'shadow-purple-500/20',
    },
    {
      icon: <SearchIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Recherche IA de Médicaments' : 'AI Drug Search',
      desc: language === 'fr'
        ? 'Recherchez n\'importe quel médicament et obtenez des informations sur les dosages, effets secondaires et disponibilité au Cameroun.'
        : 'Search any medication and get info on dosages, side effects, and Cameroon availability.',
      gradient: 'from-rose-500 to-pink-600',
      glow: 'shadow-rose-500/20',
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
      role: language === 'fr' ? 'Médecin Généraliste, Yaoundé' : 'General Practitioner, Yaound\u00e9',
      text: language === 'fr'
        ? 'CamDiag a transformé ma pratique. Je peux vérifier les interactions médicamenteuses en temps réel pendant les consultations.'
        : 'CamDiag has transformed my practice. I can verify drug interactions in real-time during consultations.',
    },
    {
      name: 'Dr. Ndi',
      role: language === 'fr' ? 'Pharmacien, Douala' : 'Pharmacist, Douala',
      text: language === 'fr'
        ? 'La base de données médicamenteuse qui inclut les remèdes traditionnels est exactement ce dont nous avions besoin au Cameroun.'
        : 'The drug database that includes traditional remedies is exactly what we needed in Cameroon.',
    },
    {
      name: 'Marie T.',
      role: language === 'fr' ? 'Infirmière, Bamenda' : 'Nurse, Bamenda',
      text: language === 'fr'
        ? "Même dans les zones rurales sans internet, l'analyse locale fonctionne parfaitement. C'est un game-changer."
        : 'Even in rural areas without internet, the local analysis works perfectly. It\'s a game-changer.',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Floating ambient orbs */}
      <FloatingOrb color="bg-cameroon-green/25" size="w-[600px] h-[600px]" top="-20%" left="-10%" delay={0} />
      <FloatingOrb color="bg-medical-blue/20" size="w-[500px] h-[500px]" top="20%" left="60%" delay={3} />
      <FloatingOrb color="bg-purple-500/15" size="w-[400px] h-[400px]" top="60%" left="20%" delay={6} />
      <FloatingOrb color="bg-emerald-500/15" size="w-[350px] h-[350px]" top="80%" left="70%" delay={9} />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 bg-black/50 backdrop-blur-xl border-b border-white/[0.04]"
      >
        <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 400 }}>
          <div className="bg-medical-green p-1.5 rounded-lg">
            <ShieldIcon className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">CamDiag</span>
        </motion.div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/50">
          {[
            { label: language === 'fr' ? 'Fonctionnalités' : 'Features', href: '#features' },
            { label: language === 'fr' ? 'Témoignages' : 'Testimonials', href: '#testimonials' },
            { label: 'MedGemma AI', href: '#ai' },
          ].map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              className="hover:text-white transition-colors relative"
              whileHover={{ y: -1 }}
            >
              {link.label}
            </motion.a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 border border-white/10 rounded-full p-1 text-xs font-semibold">
            <button onClick={() => setLanguage('en')} className={`${language === 'en' ? 'bg-white text-black shadow-sm' : 'text-white/40 hover:text-white/60'} px-3 py-1 rounded-full transition-all`}>EN</button>
            <button onClick={() => setLanguage('fr')} className={`${language === 'fr' ? 'bg-white text-black shadow-sm' : 'text-white/40 hover:text-white/60'} px-3 py-1 rounded-full transition-all`}>FR</button>
            <button onClick={() => setLanguage('fr')} className={`${language === 'fr' ? 'bg-white text-black shadow-sm' : 'text-white/40 hover:text-white/60'} px-3 py-1 rounded-full transition-all`}>Local</button>
          </div>
          <motion.button
            onClick={() => setShowLogin(true)}
            className="bg-white text-black font-bold text-sm px-5 py-2 rounded-full"
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(16,185,129,0.3)' }}
            whileTap={{ scale: 0.97 }}
          >
            {t.login}
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section ref={heroRef} className="relative z-10 px-6 md:px-12 pt-36 pb-24 max-w-6xl mx-auto text-center">
        <motion.div style={{ y: springHeroY, opacity: heroOpacity, scale: heroScale }}>
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-5 py-2.5 mb-10 text-sm backdrop-blur-sm"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-medical-green"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-white/60">{language === 'fr' ? 'Propulsé par Google MedGemma' : 'Powered by Google MedGemma'}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.95] mb-8"
          >
            <motion.span
              className="bg-gradient-to-r from-white via-emerald-100 to-medical-green bg-clip-text text-transparent inline-block"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200% 200%' }}
            >
              {language === 'fr' ? 'Diagnostic IA' : 'AI Diagnostics'}
            </motion.span>
            <br />
            <span className="text-white/90">
              {language === 'fr' ? 'pour le Cameroun' : 'for Cameroon'}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-14 leading-relaxed"
          >
            {language === 'fr'
              ? 'Assistance diagnostique par IA pour les professionnels de santé du Cameroun. Scannez, analysez et traitez — avec ou sans internet.'
              : 'AI-powered diagnostic support for Cameroon healthcare professionals. Scan, analyze, and treat — with or without internet.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              onClick={() => setShowLogin(true)}
              className="bg-medical-green text-white font-bold text-lg px-10 py-4 rounded-full shadow-2xl shadow-medical-green/30 flex items-center gap-2"
              whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(16,185,129,0.4)' }}
              whileTap={{ scale: 0.97 }}
            >
              {language === 'fr' ? 'Commencer Gratuitement' : 'Get Started Free'}
              <motion.svg
                className="w-5 h-5"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </motion.svg>
            </motion.button>
            <motion.button
              onClick={() => navigate('/app')}
              className="bg-white/[0.04] border border-white/[0.08] text-white font-bold text-lg px-10 py-4 rounded-full backdrop-blur-sm"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.97 }}
            >
              {language === 'fr' ? 'Voir la Démo' : 'View Demo'}
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Hero Mockup with parallax float */}
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-24 relative"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.08] rounded-3xl p-4 md:p-8 backdrop-blur-md shadow-2xl shadow-medical-green/5">
              <div className="bg-slate-900/90 rounded-2xl p-5 md:p-8 border border-white/[0.04]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/40" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                    <div className="w-3 h-3 rounded-full bg-green-500/40" />
                  </div>
                  <span className="text-xs text-white/20 font-mono">camdiag.app</span>
                  <span className="ml-auto text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase">MedGemma</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-4">
                    <motion.div
                      className="bg-medical-green/15 border border-medical-green/20 rounded-xl p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.5, duration: 0.6 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div
                          className="w-2 h-2 rounded-full bg-medical-green"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-xs font-bold text-medical-green uppercase tracking-wider">AI Active</span>
                      </div>
                      <p className="text-white font-bold text-lg">Malaria (P. Falciparum)</p>
                      <div className="flex gap-2 mt-2">
                        <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded">94% Match</span>
                        <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded">Low Hematocrit</span>
                      </div>
                    </motion.div>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.div
                        className="bg-white/5 rounded-xl p-3 border border-white/5"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.8, duration: 0.5 }}
                      >
                        <p className="text-[10px] text-white/25 uppercase font-bold">Hematocrit</p>
                        <p className="text-xl font-black text-white">32%</p>
                        <p className="text-[10px] text-orange-400 font-bold">Low</p>
                      </motion.div>
                      <motion.div
                        className="bg-white/5 rounded-xl p-3 border border-white/5"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.0, duration: 0.5 }}
                      >
                        <p className="text-[10px] text-white/25 uppercase font-bold">Parasites</p>
                        <p className="text-xl font-black text-white">2500/µL</p>
                        <p className="text-[10px] text-red-400 font-bold">High</p>
                      </motion.div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Prescribed', name: 'Coartem', tag: 'Antimalarial', color: 'blue', delay: 1.7 },
                      { label: 'Contri-medicine', name: 'Artemisia Tea', tag: 'Traditional', color: 'emerald', delay: 1.9 },
                      { label: 'Safety Alert', name: 'Coartem + Quinine conflict', tag: '', color: 'red', delay: 2.1 },
                    ].map((item) => (
                      <motion.div
                        key={item.label}
                        className={`bg-${item.color}-500/10 border border-${item.color}-500/20 rounded-xl p-3`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: item.delay, duration: 0.5 }}
                      >
                        <p className={`text-[10px] text-${item.color}-400 font-bold uppercase mb-1`}>{item.label}</p>
                        <p className="text-sm font-bold text-white">{item.name}</p>
                        {item.tag && <p className="text-[10px] text-white/30">{item.tag}</p>}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-medical-green/15 blur-3xl rounded-full"
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </section>

      {/* Scrolling logos marquee */}
      <section className="relative z-10 py-12 border-y border-white/[0.04] overflow-hidden">
        <p className="text-center text-xs text-white/20 uppercase tracking-widest font-bold mb-8">
          {language === 'fr' ? 'Utilisé dans les établissements de santé du Cameroun' : 'Trusted across Cameroon healthcare facilities'}
        </p>
        <Marquee speed={35}>
          {[
            'Yaound\u00e9 Central Hospital', 'H\u00f4pital G\u00e9n\u00e9ral de Douala',
            'Bamenda Regional Hospital', 'Centre Hospitalier Universitaire',
            'Waspito Telehealth', 'MedPlus Pharmacy',
            'Green Cross Pharma', 'H\u00f4tel Dieu de Bonat\u00e9li',
          ].map((name) => (
            <span key={name} className="text-white/15 text-sm font-semibold px-6">{name}</span>
          ))}
        </Marquee>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <StaggerContainer className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <motion.p
                className="text-5xl md:text-6xl font-black bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {stat.value}
              </motion.p>
              <p className="text-sm text-white/25 font-medium mt-3">{stat.label}</p>
            </div>
          ))}
        </StaggerContainer>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 md:px-12 py-24 max-w-6xl mx-auto">
        <motion.div {...useAppearOnScroll()} className="text-center mb-20">
          <p className="text-sm font-bold text-medical-green uppercase tracking-[0.2em] mb-5">
            {language === 'fr' ? 'Fonctionnalités' : 'Features'}
          </p>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight">
            {language === 'fr' ? 'Tout ce dont vous avez besoin' : 'Everything you need'}
          </h2>
          <p className="text-white/30 text-lg mt-6 max-w-xl mx-auto leading-relaxed">
            {language === 'fr'
              ? 'Des outils de diagnostic conçus pour les réalités du terrain au Cameroun.'
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
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={`group bg-white/[0.02] border border-white/[0.05] rounded-2xl p-7 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-500 hover:shadow-2xl ${feature.glow}`}
            >
              <motion.div
                className={`bg-gradient-to-br ${feature.gradient} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-5`}
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                transition={{ duration: 0.4 }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-sm text-white/35 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Section with parallax reveal */}
      <section id="ai" className="relative z-10 px-6 md:px-12 py-28">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -60, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.p
              className="text-sm font-bold text-purple-400 uppercase tracking-[0.2em] mb-5"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              Google MedGemma
            </motion.p>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
              {language === 'fr' ? 'IA Médicale de' : 'Medical-Grade'}{' '}
              <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                {language === 'fr' ? 'Qualité Médicale' : 'AI Power'}
              </span>
            </h2>
            <p className="text-white/35 text-lg leading-relaxed mb-10">
              {language === 'fr'
                ? "Intégré avec MedGemma de Google, CamDiag fournit une analyse d'image médicale, une vérification des interactions médicamenteuses et des informations sur les médicaments — le tout par IA."
                : "Integrated with Google's MedGemma, CamDiag delivers medical image analysis, drug interaction checking, and medication info — all AI-powered."}
            </p>
            <StaggerContainer className="space-y-5">
              {[
                language === 'fr' ? "Analyse d'image médicale en temps réel" : 'Real-time medical image analysis',
                language === 'fr' ? 'Détection d\'interactions médicamenteuses' : 'Drug interaction detection',
                language === 'fr' ? 'Recherche de médicaments adaptée au Cameroun' : 'Cameroon-specific medication search',
                language === 'fr' ? 'Moteur local de secours hors ligne' : 'Offline fallback local engine',
              ].map((item) => (
                <div key={item} className="flex items-center gap-4">
                  <motion.div
                    className="w-7 h-7 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0 border border-purple-500/20"
                    whileInView={{ scale: [0.8, 1] }}
                    viewport={{ once: true }}
                  >
                    <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </motion.div>
                  <span className="text-sm text-white/50 font-medium">{item}</span>
                </div>
              ))}
            </StaggerContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="bg-gradient-to-br from-purple-500/[0.08] to-fuchsia-500/[0.05] border border-purple-500/15 rounded-3xl p-8 backdrop-blur-md shadow-2xl shadow-purple-500/5">
                <div className="flex items-center gap-3 mb-8">
                  <motion.div
                    className="w-3 h-3 rounded-full bg-purple-400"
                    animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-[0.15em]">MedGemma AI</span>
                </div>
                <div className="space-y-5">
                  <motion.div
                    className="bg-black/40 rounded-xl p-5 border border-white/[0.04]"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-[10px] text-white/20 mb-2 uppercase tracking-widest">Prompt</p>
                    <p className="text-sm text-white/50 font-mono">"Analyze this malaria RDT scan..."</p>
                  </motion.div>
                  <motion.div
                    className="flex justify-center"
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <svg className="w-7 h-7 text-purple-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  </motion.div>
                  <motion.div
                    className="bg-black/40 rounded-xl p-5 border border-purple-500/10"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                  >
                    <p className="text-[10px] text-purple-400 mb-3 font-bold uppercase tracking-widest">Response</p>
                    <div className="space-y-3">
                      {[
                        { badge: '94%', badgeColor: 'emerald', text: 'Malaria (P. Falciparum)' },
                        { badge: 'RX', badgeColor: 'blue', text: 'Coartem recommended' },
                        { badge: '!', badgeColor: 'red', text: 'Coartem + Quinine conflict' },
                      ].map((item, i) => (
                        <motion.div
                          key={item.text}
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 1.0 + i * 0.15 }}
                        >
                          <span className={`bg-${item.badgeColor}-500/20 text-${item.badgeColor}-400 text-[10px] font-bold px-2 py-0.5 rounded shrink-0`}>{item.badge}</span>
                          <span className="text-sm text-white/70">{item.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-1/2 h-20 bg-purple-500/15 blur-3xl rounded-full"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 px-6 md:px-12 py-28 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <motion.div {...useAppearOnScroll()} className="text-center mb-20">
            <p className="text-sm font-bold text-medical-green uppercase tracking-[0.2em] mb-5">
              {language === 'fr' ? 'Témoignages' : 'Testimonials'}
            </p>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight">
              {language === 'fr' ? 'Approuvé par les médecins' : 'Trusted by doctors'}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 60, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-7 hover:bg-white/[0.04] transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-medical-green to-cameroon-green flex items-center justify-center text-white text-sm font-black shadow-lg shadow-medical-green/10"
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  >
                    {item.name.charAt(0)}{item.name.split('.')[1]?.trim()?.charAt(0) || ''}
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-white">{item.name}</p>
                    <p className="text-xs text-white/25">{item.role}</p>
                  </div>
                </div>
                <p className="text-sm text-white/40 leading-relaxed italic">"{item.text}"</p>
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
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.01] border border-white/[0.06] rounded-[2rem] p-12 md:p-20 relative overflow-hidden">
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ background: [
                'linear-gradient(135deg, rgba(16,185,129,0.08), transparent, rgba(168,85,247,0.08))',
                'linear-gradient(135deg, rgba(168,85,247,0.08), transparent, rgba(16,185,129,0.08))',
                'linear-gradient(135deg, rgba(16,185,129,0.08), transparent, rgba(168,85,247,0.08))',
              ] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <div className="relative z-10">
              <motion.h2
                className="text-5xl md:text-6xl font-black tracking-tight mb-5"
                whileInView={{ opacity: [0, 1], y: [30, 0] }}
                viewport={{ once: true }}
              >
                {language === 'fr' ? 'Prêt à commencer ?' : 'Ready to start?'}
              </motion.h2>
              <p className="text-white/30 text-lg mb-10">
                {language === 'fr'
                  ? 'Rejoignez des milliers de professionnels de santé qui utilisent CamDiag au Cameroun.'
                  : 'Join thousands of healthcare professionals using CamDiag in Cameroon.'}
              </p>
              <motion.button
                onClick={() => setShowLogin(true)}
                className="bg-medical-green text-white font-bold text-lg px-12 py-5 rounded-full shadow-2xl shadow-medical-green/30"
                whileHover={{ scale: 1.05, boxShadow: '0 0 80px rgba(16,185,129,0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                {language === 'fr' ? 'Commencer Gratuitement' : 'Get Started Free'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-12 py-12 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.02 }}>
            <div className="bg-medical-green p-1 rounded-md">
              <ShieldIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">CamDiag</span>
          </motion.div>
          <p className="text-xs text-white/15 text-center">
            {language === 'fr'
              ? "© 2026 CamDiag par NDN Analytics. Ceci n'est PAS un vrai diagnostic. Consultez toujours un médecin."
              : '© 2026 CamDiag by NDN Analytics. This is NOT a real diagnosis. Always consult a doctor.'}
          </p>
          <div className="flex items-center gap-6 text-sm text-white/25">
            <a href="#" className="hover:text-white/50 transition-colors">{language === 'fr' ? 'Confidentialité' : 'Privacy'}</a>
            <a href="#" className="hover:text-white/50 transition-colors">{language === 'fr' ? 'Conditions' : 'Terms'}</a>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
          onClick={() => setShowLogin(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0, filter: 'blur(10px)' }}
            animate={{ scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-slate-900/95 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">{t.welcome_back}</h2>
              <motion.button onClick={() => setShowLogin(false)} className="text-white/30 hover:text-white transition-colors" whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </motion.button>
            </div>
            <p className="text-white/30 text-sm mb-8">{t.login_subtitle}</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <input
                  type="email"
                  placeholder={t.email_placeholder}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-medical-green/50 outline-none transition-all focus:shadow-lg focus:shadow-medical-green/5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <input
                  type="password"
                  placeholder={t.password_placeholder}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-medical-green/50 outline-none transition-all focus:shadow-lg focus:shadow-medical-green/5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </motion.div>
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full bg-medical-green text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
                whileHover={{ boxShadow: '0 0 40px rgba(16,185,129,0.3)' }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? '...' : t.login}
              </motion.button>
            </form>

            <div className="mt-8 text-center">
              <motion.button
                onClick={() => { setShowLogin(false); navigate('/app'); }}
                className="text-white/25 text-sm hover:text-white/50 transition-colors"
                whileHover={{ x: 3 }}
              >
                {language === 'fr' ? 'Continuer sans compte →' : 'Continue without account →'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Landing;