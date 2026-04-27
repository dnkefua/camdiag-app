import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './App.css';

const App = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<ErrorBoundary><DiagnosticHub /></ErrorBoundary>} />
          <Route path="/scanner" element={<ErrorBoundary><Scanner /></ErrorBoundary>} />
          <Route path="/analysis" element={<ErrorBoundary><AnalysisResults /></ErrorBoundary>} />
          <Route path="/next-steps" element={<ErrorBoundary><NextSteps /></ErrorBoundary>} />
          <Route path="/drugs" element={<ErrorBoundary><DrugDatabase /></ErrorBoundary>} />
          <Route path="/patients" element={<ErrorBoundary><PatientRecords /></ErrorBoundary>} />
          <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
          <Route path="/questionnaire" element={<ErrorBoundary><Questionnaire /></ErrorBoundary>} />
          <Route path="/blog" element={<ErrorBoundary><Blog /></ErrorBoundary>} />
          <Route path="/coming-up" element={<ErrorBoundary><ComingUp /></ErrorBoundary>} />
        </Routes>
      </AnimatePresence>
    </div>
  );
};

export default App;