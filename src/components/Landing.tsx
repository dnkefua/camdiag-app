import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { ShieldIcon, CameraIcon, ClipBoardIcon, BoltIcon, UsersIcon } from '../components/ui/Icons';

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
};

const Landing = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const { isAuthenticated, login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);

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
    },
    {
      icon: <ClipBoardIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Base de Données Médicamenteuse' : 'Drug Database',
      desc: language === 'fr'
        ? 'Recherchez des médicaments disponibles au Cameroun. Vérifiez les interactions médicamenteuses avec MedGemma AI.'
        : 'Search medications available in Cameroon. Check drug interactions with MedGemma AI.',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      icon: <ShieldIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Contri-Médecine Locale' : 'Local Contri-Medicine',
      desc: language === 'fr'
        ? 'Intègre les remèdes traditionnels du Cameroun avec la médecine moderne pour des soins holistiques.'
        : 'Integrates Cameroon traditional remedies with modern medicine for holistic care.',
      gradient: 'from-cameroon-green to-emerald-600',
    },
    {
      icon: <BoltIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Hors Ligne' : 'Works Offline',
      desc: language === 'fr'
        ? 'Conçu pour les zones à faible bande passante. Les analyses locales fonctionnent sans internet.'
        : 'Built for low-bandwidth areas. Local analysis works without internet.',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      icon: <UsersIcon className="h-8 w-8" />,
      title: language === 'fr' ? 'Bilingue EN/FR' : 'Bilingual EN/FR',
      desc: language === 'fr'
        ? 'Interface complète en anglais et français, conçu pour les professionnels de santé du Cameroun.'
        : 'Full English and French interface, designed for Cameroon healthcare professionals.',
      gradient: 'from-purple-500 to-fuchsia-600',
    },
  ];

  const stats = [
    { value: '12,842', label: language === 'fr' ? 'Utilisateurs Actifs' : 'Active Users' },
    { value: '94%', label: language === 'fr' ? 'Précision du Scan' : 'Scan Accuracy' },
    { value: '50ms', label: language === 'fr' ? 'Temps de Réponse' : 'Response Time' },
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
        ? 'La base de données médicamenteuse qui inclut les remèdes traditionnels est exactement ce dont nous avions besoin au Cameroun.'
        : 'The drug database that includes traditional remedies is exactly what we needed in Cameroon.',
    },
    {
      name: 'Marie T.',
      role: language === 'fr' ? 'Infirmière, Bamenda' : 'Nurse, Bamenda',
      text: language === 'fr'
        ? 'Même dans les zones rurales sans internet, l\'analyse locale fonctionne parfaitement. C\'est un game-changer.'
        : 'Even in rural areas without internet, the local analysis works perfectly. It\'s a game-changer.',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cameroon-green/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-medical-blue/15 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5"
      >
        <div className="flex items-center gap-2">
          <div className="bg-medical-green p-1.5 rounded-lg">
            <ShieldIcon className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">CamDiag</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <a href="#features" className="hover:text-white transition-colors">{language === 'fr' ? 'Fonctionnalités' : 'Features'}</a>
          <a href="#testimonials" className="hover:text-white transition-colors">{language === 'fr' ? 'Témoignages' : 'Testimonials'}</a>
          <a href="#ai" className="hover:text-white transition-colors">MedGemma AI</a>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/10 rounded-full p-1 text-xs font-semibold">
            <button onClick={() => setLanguage('en')} className={`${language === 'en' ? 'bg-white text-black' : 'text-white/60'} px-3 py-1 rounded-full transition-all`}>EN</button>
            <button onClick={() => setLanguage('fr')} className={`${language === 'fr' ? 'bg-white text-black' : 'text-white/60'} px-3 py-1 rounded-full transition-all`}>FR</button>
          </div>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-white text-black font-bold text-sm px-5 py-2 rounded-full hover:bg-white/90 transition-all"
          >
            {t.login}
          </button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative z-10 px-6 md:px-12 pt-20 pb-32 max-w-6xl mx-auto text-center">
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 text-sm">
            <div className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
            <span className="text-white/70">{language === 'fr' ? 'Propulsé par Google MedGemma' : 'Powered by Google MedGemma'}</span>
          </div>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-8"
        >
          <span className="bg-gradient-to-r from-white via-emerald-200 to-medical-green bg-clip-text text-transparent">
            {language === 'fr' ? 'Diagnostic IA' : 'AI Diagnostics'}
          </span>
          <br />
          <span className="text-white">
            {language === 'fr' ? 'pour le Cameroun' : 'for Cameroon'}
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          {language === 'fr'
            ? 'Assistance diagnostique par IA pour les professionnels de santé du Cameroun. Scannez, analysez et traitez — avec ou sans internet.'
            : 'AI-powered diagnostic support for Cameroon healthcare professionals. Scan, analyze, and treat — with or without internet.'}
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => setShowLogin(true)}
            className="bg-medical-green text-white font-bold text-lg px-8 py-4 rounded-full hover:brightness-110 transition-all shadow-lg shadow-medical-green/30 flex items-center gap-2"
          >
            {language === 'fr' ? 'Commencer Gratuitement' : 'Get Started Free'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-white/5 border border-white/10 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-white/10 transition-all"
          >
            {language === 'fr' ? 'Voir la Démo' : 'View Demo'}
          </button>
        </motion.div>

        {/* Hero Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-20 relative"
        >
          <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-sm">
            <div className="bg-slate-900/80 rounded-2xl p-6 md:p-8 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-white/30 font-mono">camdiag.app</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-4">
                  <div className="bg-medical-green/20 border border-medical-green/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
                      <span className="text-xs font-bold text-medical-green uppercase tracking-wider">AI Active — MedGemma</span>
                    </div>
                    <p className="text-white font-bold text-lg">Malaria (P. Falciparum)</p>
                    <div className="flex gap-2 mt-2">
                      <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded">94% Match</span>
                      <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded">Low Hematocrit</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-white/30 uppercase font-bold">Hematocrit</p>
                      <p className="text-xl font-black text-white">32%</p>
                      <p className="text-[10px] text-orange-400 font-bold">Low</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-white/30 uppercase font-bold">Parasites</p>
                      <p className="text-xl font-black text-white">2500/µL</p>
                      <p className="text-[10px] text-red-400 font-bold">High</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Prescribed</p>
                    <p className="text-sm font-bold text-white">Coartem</p>
                    <p className="text-[10px] text-white/40">Antimalarial</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">Contri-medicine</p>
                    <p className="text-sm font-bold text-white">Artemisia Tea</p>
                    <p className="text-[10px] text-white/40">Traditional</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-[10px] text-red-400 font-bold uppercase mb-1">Safety Alert</p>
                    <p className="text-xs font-bold text-red-300">Coartem + Quinine conflict detected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-medical-green/20 blur-3xl rounded-full" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-6 md:px-12 py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{stat.value}</p>
              <p className="text-sm text-white/40 font-medium mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 md:px-12 py-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-bold text-medical-green uppercase tracking-widest mb-4">{language === 'fr' ? 'Fonctionnalités' : 'Features'}</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            {language === 'fr' ? 'Tout ce dont vous avez besoin' : 'Everything you need'}
          </h2>
          <p className="text-white/50 text-lg mt-4 max-w-xl mx-auto">
            {language === 'fr'
              ? 'Des outils de diagnostic conçus pour les réalités du terrain au Cameroun.'
              : 'Diagnostic tools designed for the realities of healthcare in Cameroon.'}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
            >
              <div className={`bg-gradient-to-br ${feature.gradient} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-4">Google MedGemma</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
              {language === 'fr' ? 'IA Médicale de' : 'Medical-Grade'}{' '}
              <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                {language === 'fr' ? 'Qualité Médicale' : 'AI Power'}
              </span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              {language === 'fr'
                ? 'Intégré avec MedGemma de Google, CamDiag fournit une analyse d\'image médicale, une vérification des interactions médicamenteuses et des informations sur les médicaments — le tout par IA.'
                : 'Integrated with Google\'s MedGemma, CamDiag delivers medical image analysis, drug interaction checking, and medication info — all AI-powered.'}
            </p>
            <div className="space-y-4">
              {[
                language === 'fr' ? 'Analyse d\'image médicale en temps réel' : 'Real-time medical image analysis',
                language === 'fr' ? 'Détection d\'interactions médicamenteuses' : 'Drug interaction detection',
                language === 'fr' ? 'Recherche de médicaments adaptée au Cameroun' : 'Cameroon-specific medication search',
                language === 'fr' ? 'Moteur local de secours hors ligne' : 'Offline fallback local engine',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-sm text-white/70 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 rounded-3xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">MedGemma AI</span>
              </div>
              <div className="space-y-4">
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-white/40 mb-2">Prompt</p>
                  <p className="text-sm text-white/70 font-mono">"Analyze this malaria RDT scan..."</p>
                </div>
                <div className="flex justify-center">
                  <svg className="w-6 h-6 text-purple-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-purple-500/10">
                  <p className="text-xs text-purple-400 mb-2 font-bold">Response</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">94%</span>
                      <span className="text-sm text-white/80">Malaria (P. Falciparum)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded">RX</span>
                      <span className="text-sm text-white/80">Coartem recommended</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded">!</span>
                      <span className="text-sm text-white/80">Coartem + Quinine conflict</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-1/2 h-16 bg-purple-500/20 blur-3xl rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 px-6 md:px-12 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-sm font-bold text-medical-green uppercase tracking-widest mb-4">{language === 'fr' ? 'Témoignages' : 'Testimonials'}</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              {language === 'fr' ? 'Approuvé par les médecins' : 'Trusted by doctors'}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-medical-green to-cameroon-green flex items-center justify-center text-white text-sm font-black">
                    {item.name.charAt(0)}{item.name.split('.')[1]?.trim()?.charAt(0) || ''}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{item.name}</p>
                    <p className="text-xs text-white/40">{item.role}</p>
                  </div>
                </div>
                <p className="text-sm text-white/60 leading-relaxed italic">"{item.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.08] rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-medical-green/10 via-transparent to-purple-500/10 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                {language === 'fr' ? 'Prêt à commencer ?' : 'Ready to start?'}
              </h2>
              <p className="text-white/50 text-lg mb-8">
                {language === 'fr'
                  ? 'Rejoignez des milliers de professionnels de santé qui utilisent CamDiag au Cameroun.'
                  : 'Join thousands of healthcare professionals using CamDiag in Cameroon.'}
              </p>
              <button
                onClick={() => setShowLogin(true)}
                className="bg-medical-green text-white font-bold text-lg px-10 py-4 rounded-full hover:brightness-110 transition-all shadow-lg shadow-medical-green/30"
              >
                {language === 'fr' ? 'Commencer Gratuitement' : 'Get Started Free'}
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-12 py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-medical-green p-1 rounded-md">
              <ShieldIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">CamDiag</span>
          </div>
          <p className="text-xs text-white/30 text-center">
            {language === 'fr'
              ? '© 2026 CamDiag par NDN Analytics. Ceci n\'est PAS un vrai diagnostic. Consultez toujours un médecin.'
              : '© 2026 CamDiag by NDN Analytics. This is NOT a real diagnosis. Always consult a doctor.'}
          </p>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white/70 transition-colors">{language === 'fr' ? 'Confidentialité' : 'Privacy'}</a>
            <a href="#" className="hover:text-white/70 transition-colors">{language === 'fr' ? 'Conditions' : 'Terms'}</a>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          onClick={() => setShowLogin(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">{t.welcome_back}</h2>
              <button onClick={() => setShowLogin(false)} className="text-white/40 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-white/50 text-sm mb-8">{t.login_subtitle}</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder={t.email_placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-medical-green outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder={t.password_placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-medical-green outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-medical-green text-white font-bold py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isLoading ? '...' : t.login}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setShowLogin(false); navigate('/app'); }}
                className="text-white/40 text-sm hover:text-white/70 transition-colors"
              >
                {language === 'fr' ? 'Continuer sans compte →' : 'Continue without account →'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Landing;