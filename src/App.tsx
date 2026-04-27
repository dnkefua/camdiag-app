import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import './App.css';

const Landing = lazy(() => import('./components/Landing'));
const DiagnosticHub = lazy(() => import('./components/DiagnosticHub'));
const Scanner = lazy(() => import('./components/Scanner'));
const AnalysisResults = lazy(() => import('./components/AnalysisResults'));
const NextSteps = lazy(() => import('./components/NextSteps'));
const DrugDatabase = lazy(() => import('./components/DrugDatabase'));
const PatientRecords = lazy(() => import('./components/PatientRecords'));
const Settings = lazy(() => import('./components/Settings'));
const Questionnaire = lazy(() => import('./components/Questionnaire'));
const Blog = lazy(() => import('./components/Blog'));
const ComingUp = lazy(() => import('./components/ComingUp'));

const App = () => {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><LoadingSpinner size="lg" message="Loading..." /></div>}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<ErrorBoundary><Landing /></ErrorBoundary>} />
            <Route path="/app" element={<ErrorBoundary><DiagnosticHub /></ErrorBoundary>} />
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
      </Suspense>
    </div>
  );
};

export default App;