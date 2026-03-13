import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DiagnosticHub from './components/DiagnosticHub';
import Scanner from './components/Scanner';
import AnalysisResults from './components/AnalysisResults';
import NextSteps from './components/NextSteps';
import DrugDatabase from './components/DrugDatabase';
import PatientRecords from './components/PatientRecords';
import Settings from './components/Settings';
import Questionnaire from './components/Questionnaire';
import Blog from './components/Blog';
import ComingUp from './components/ComingUp';
import './App.css';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('hub');
  const [language, setLanguage] = useState('en');

  const translations = {
    en: {
      hub_greeting: 'Hello, Dr. Kamga',
      hub_title: 'Diagnostic Hub',
      new_scan: 'New Scan',
      ai_support: 'Instant AI Diagnosis Support',
      drugs: 'Drug Database',
      facilities: 'Near Facilities',
      recent: 'Recent Results',
      view_all: 'View All',
      home: 'Home',
      patients: 'Patients',
      settings: 'Settings',
      align: 'Align your document within the frame',
      positioning: 'Positioning document...',
      gallery: 'Gallery',
      multi_scan: 'Multi-Scan',
      analysis_title: 'CamDiag Analysis',
      scan_overlay: 'Scan Overlay',
      ai_active: 'AI Active',
      confidence: 'Confidence',
      what_means: 'What this means',
      diagnoses: 'Possible Diagnoses',
      prognosis: 'Prognosis',
      lifestyle: 'Lifestyle Tips',
      disclaimer_title: 'Medical Disclaimer',
      disclaimer_text: 'This is NOT a real diagnosis.',
      disclaimer_consult: 'Consult a doctor immediately for professional medical advice and treatment.',
      find_clinic: 'Find Nearby Clinic',
      download_pdf: 'Download PDF Report',
      back: 'Back',
      next_steps: 'Next Steps',
      scan_summary: 'Scan Summary',
      scanned_time: 'Scanned 2 mins ago',
      primary_found: 'Primary Condition Found:',
      probability: 'Probability',
      share_report: 'Share Report with Doctor',
      speak_pro: 'Speak to a Professional Now',
      consult_desc: 'Instant video consultation with a certified dermatologist through our partner, Waspito.',
      consult_btn: 'Consult a Doctor',
      doctors_online: '42 Doctors Online',
      nearby_clinics: 'Nearby Clinics',
      view_map: 'View Map',
      open: 'OPEN',
      insurance: 'INSURANCE ACCEPTED',
      closes: 'CLOSES 5PM',
      scan: 'Scan',
      profile: 'Profile',
      clinical_markers: 'Clinical Markers',
      hematocrit: 'Hematocrit Count',
      malaria_parasites: 'Malaria Parasites',
      hospitals: 'Hospitals',
      pharmacies: 'Pharmacies',
      telehealth: 'Telehealth',
      clinics: 'Clinics',
      remedies_title: 'Remedies & Support',
      prescribed: 'Prescribed Medication',
      contri_medicine: 'Contri-medicine',
      cameroon_avail: 'Usually available in Cameroon',
      safety_warning: 'Safety Alert: Drug Interaction!',
      safety_description: 'Cross-checking medications for all possible diagnoses...',
      contraindication_detected: 'Contraindication Detected!',
      malicious_interaction: 'Taking these together could be harmful or counteract each other.',
      clinical_reasoning: 'Clinical Reasoning',
      active_users: 'Active Users',
      total_active: 'Total active in app',
      history: 'Patient History',
      notifications: 'Notifications',
      security: 'Security',
      about: 'About',
      logout: 'Logout',
      search: 'Search medications...',
      questionnaire_title: 'Medical Feedback',
      quest_intro: 'Earn rewards by sharing your experience',
      quest_q1: 'Which medication did you use?',
      quest_q2: 'Where did you purchase it?',
      quest_q3: 'Did it work for you?',
      quest_audio: 'Record Voice Note',
      quest_image: 'Attach Photo',
      quest_submit: 'Submit & Earn Credits',
      quest_reward: 'Reward Allocated: +50 Credits!',
      view_map: 'Open Interactive Map',
      map_radius: 'Found within 50 miles',
      conflicting_with: 'Conflicting with:',
      blog_title: 'Blog & News',
      blog_stories: 'Stories',
      blog_developments: 'Developments',
      blog_innovations: 'Innovations',
      blog_reviews: 'Reviews',
      blog_classifieds: 'Classifieds',
      coming_up_title: 'Coming Up'
    },
    fr: {
      hub_greeting: 'Bonjour, Dr Kamga',
      hub_title: 'Centre de Diagnostic',
      new_scan: 'Nouveau Scan',
      ai_support: 'Support de Diagnostic IA Instantané',
      drugs: 'Base de Médicaments',
      facilities: 'Établissements Proches',
      recent: 'Résultats Récents',
      view_all: 'Voir Tout',
      home: 'Accueil',
      patients: 'Patients',
      settings: 'Paramètres',
      align: 'Alignez votre document dans le cadre',
      positioning: 'Positionnement du document...',
      gallery: 'Galerie',
      multi_scan: 'Multi-Scan',
      analysis_title: 'Analyse CamDiag',
      scan_overlay: 'Superposition de Scan',
      ai_active: 'IA Active',
      confidence: 'Confiance',
      what_means: 'Ce que cela signifie',
      diagnoses: 'Diagnostics Possibles',
      prognosis: 'Pronostic',
      lifestyle: 'Conseils de Vie',
      disclaimer_title: 'Avis Médical',
      disclaimer_text: 'Ceci n\'est PAS un vrai diagnostic.',
      disclaimer_consult: 'Consultez immédiatement un médecin pour obtenir des conseils et un traitement médical professionnel.',
      find_clinic: 'Trouver une Clinique',
      download_pdf: 'Télécharger le Rapport PDF',
      back: 'Retour',
      next_steps: 'Étapes Suivantes',
      scan_summary: 'Résumé du Scan',
      scanned_time: 'Scanné il y a 2 min',
      primary_found: 'Condition Principale Trouvée:',
      probability: 'Probabilité',
      share_report: 'Partager le Rapport avec un Médecin',
      speak_pro: 'Parler à un Professionnel Maintenant',
      consult_desc: 'Consultation vidéo instantanée avec un dermatologue certifié via notre partenaire, Waspito.',
      consult_btn: 'Consulter un Médecin',
      doctors_online: '42 Médecins en Ligne',
      nearby_clinics: 'Cliniques à Proximité',
      view_map: 'Voir la Carte',
      open: 'OUVERT',
      insurance: 'ASSURANCE ACCEPTÉE',
      closes: 'FERME À 17H',
      scan: 'Scanner',
      profile: 'Profil',
      clinical_markers: 'Marqueurs Cliniques',
      hematocrit: 'Taux d’Hématocrite',
      malaria_parasites: 'Parasites du Paludisme',
      hospitals: 'Hôpitaux',
      pharmacies: 'Pharmacies',
      telehealth: 'Télésanté',
      clinics: 'Cliniques',
      remedies_title: 'Remèdes & Soutien',
      prescribed: 'Médicaments Prescrits',
      contri_medicine: 'Contre-médecine',
      cameroon_avail: 'Généralement disponible au Cameroun',
      safety_warning: 'Alerte de Sécurité: Interaction Médicamenteuse!',
      safety_description: 'Vérification des médicaments pour tous les diagnostics...',
      contraindication_detected: 'Contre-indication Détectée !',
      malicious_interaction: 'Prendre ces médicaments ensemble pourrait être nocif ou s\'annuler.',
      clinical_reasoning: 'Raisonnement Clinique',
      active_users: 'Utilisateurs Actifs',
      total_active: 'Total actif dans l\'application',
      history: 'Historique du Patient',
      notifications: 'Notifications',
      security: 'Sécurité',
      about: 'À propos',
      logout: 'Déconnexion',
      search: 'Rechercher des médicaments...',
      questionnaire_title: 'Retour Médical',
      quest_intro: 'Gagnez des récompenses en partageant votre expérience',
      quest_q1: 'Quel médicament avez-vous utilisé ?',
      quest_q2: 'Où l\'avez-vous acheté ?',
      quest_q3: 'Est-ce que ça a marché pour vous ?',
      quest_audio: 'Enregistrer une note vocale',
      quest_image: 'Joindre une photo',
      quest_submit: 'Envoyer et gagner des crédits',
      quest_reward: 'Récompense allouée : +50 crédits !',
      view_map: 'Ouvrir la carte interactive',
      map_radius: 'Trouvé dans un rayon de 80 km',
      conflicting_with: 'En conflit avec :',
      blog_title: 'Blog & Infos',
      blog_stories: 'Histoires',
      blog_developments: 'Développements',
      blog_innovations: 'Innovations',
      blog_reviews: 'Avis',
      blog_classifieds: 'Petites Annonces',
      coming_up_title: 'À Venir'
    }
  };

  const t = translations[language];

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const onNavigate = (screen) => setCurrentScreen(screen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'hub':
        return (
          <motion.div key="hub" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <DiagnosticHub onNewScan={() => onNavigate('scanner')} onNavigate={onNavigate} t={t} language={language} setLanguage={setLanguage} />
          </motion.div>
        );
      case 'scanner':
        return (
          <motion.div key="scanner" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="fixed inset-0 z-50 overflow-hidden" transition={{ duration: 0.3 }}>
            <Scanner onCapture={() => onNavigate('analysis')} onClose={() => onNavigate('hub')} t={t} />
          </motion.div>
        );
      case 'analysis':
        return (
          <motion.div key="analysis" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <AnalysisResults onNext={() => onNavigate('next')} onBack={() => onNavigate('scanner')} onNavigate={onNavigate} t={t} />
          </motion.div>
        );
      case 'next':
        return (
          <motion.div key="next" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <NextSteps onHome={() => onNavigate('hub')} onScan={() => onNavigate('scanner')} onNavigate={onNavigate} t={t} />
          </motion.div>
        );
      case 'drugs':
        return (
          <motion.div key="drugs" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <DrugDatabase onBack={() => onNavigate('hub')} onNavigate={onNavigate} t={t} />
          </motion.div>
        );
      case 'patients':
        return (
          <motion.div key="patients" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <PatientRecords onBack={() => onNavigate('hub')} onNavigate={onNavigate} t={t} />
          </motion.div>
        );
      case 'settings':
        return (
          <motion.div key="settings" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <Settings onBack={() => onNavigate('hub')} onNavigate={onNavigate} t={t} />
          </motion.div>
        );
      case 'questionnaire':
        return (
          <motion.div key="questionnaire" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <Questionnaire onBack={() => onNavigate('analysis')} onNavigate={onNavigate} t={t} />
          </motion.div>
        );
      case 'blog':
        return (
          <motion.div key="blog" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <Blog onBack={() => onNavigate('hub')} t={t} />
          </motion.div>
        );
      case 'comingup':
        return (
          <motion.div key="comingup" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <ComingUp onBack={() => onNavigate('hub')} t={t} />
          </motion.div>
        );
      default:
        return <DiagnosticHub onNewScan={() => onNavigate('scanner')} onNavigate={onNavigate} t={t} />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
    </div>
  );
};

export default App;
