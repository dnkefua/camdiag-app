import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { MedicalDisclaimer } from './components/ui/MedicalDisclaimer';
import { reportEnvWarnings } from './utils/env';
import { trackEvent } from './services/analytics';
import { PRIVACY_CHANGED_EVENT } from './services/privacy';
import { useAuth } from './contexts/AuthContext';
import './App.css';

const Landing = lazy(() => import('./components/Landing'));
const DemoScanner = lazy(() => import('./components/DemoScanner'));
const DiagnosticHub = lazy(() => import('./components/DiagnosticHub'));
const Scanner = lazy(() => import('./components/Scanner'));
const TranscriptionReview = lazy(() => import('./components/TranscriptionReview'));
const AnalysisResults = lazy(() => import('./components/AnalysisResults'));
const NextSteps = lazy(() => import('./components/NextSteps'));
const DrugDatabase = lazy(() => import('./components/DrugDatabase'));
const PatientRecords = lazy(() => import('./components/PatientRecords'));
const Settings = lazy(() => import('./components/Settings'));
const Questionnaire = lazy(() => import('./components/Questionnaire'));
const Blog = lazy(() => import('./components/Blog'));
const ComingUp = lazy(() => import('./components/ComingUp'));
const NotFound = lazy(() => import('./components/NotFound'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const clinicalRoute = ['/scanner', '/transcription-review', '/analysis', '/next-steps', '/drugs', '/patients'].includes(location.pathname);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cameroon-ivory">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/?login=1" replace />;
  }

  if (clinicalRoute && !user?.canUseClinicalTools) return (
    <main className="mx-auto max-w-lg p-8 space-y-4">
      <h1 className="text-2xl font-bold">Clinical access requires verification</h1>
      <p>Your organization must verify your clinician credentials before you can process patient documents. Changing a profile does not grant access.</p>
      <Link to="/settings" className="block underline">View account status</Link>
      <Link to="/demo" className="block underline">Explore the synthetic demo</Link>
    </main>
  );

  return <>{children}</>;
};

const RouteAnalytics = () => {
  const location = useLocation();
  useEffect(() => {
    window.dispatchEvent(new Event(PRIVACY_CHANGED_EVENT));
    trackEvent('page_view', { path: location.pathname });
  }, [location.pathname, location.search, location.hash]);
  return null;
};

const App = () => {
  useEffect(() => {
    reportEnvWarnings();
  }, []);

  return (
    <div className="min-h-screen">
      <RouteAnalytics />
      <MedicalDisclaimer>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-cameroon-ivory"><LoadingSpinner size="lg" message="Loading..." /></div>}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<ErrorBoundary><Landing /></ErrorBoundary>} />
            <Route path="/demo" element={<ErrorBoundary><DemoScanner /></ErrorBoundary>} />
            <Route path="/app" element={<ProtectedRoute><ErrorBoundary><DiagnosticHub /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/scanner" element={<ProtectedRoute><ErrorBoundary><Scanner /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/transcription-review" element={<ProtectedRoute><ErrorBoundary><TranscriptionReview /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/analysis" element={<ProtectedRoute><ErrorBoundary><AnalysisResults /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/next-steps" element={<ProtectedRoute><ErrorBoundary><NextSteps /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/drugs" element={<ProtectedRoute><ErrorBoundary><DrugDatabase /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><ErrorBoundary><PatientRecords /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ErrorBoundary><Settings /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/questionnaire" element={<ProtectedRoute><ErrorBoundary><Questionnaire /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/blog" element={<ProtectedRoute><ErrorBoundary><Blog /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/coming-up" element={<ProtectedRoute><ErrorBoundary><ComingUp /></ErrorBoundary></ProtectedRoute>} />
            <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
      </MedicalDisclaimer>
    </div>
  );
};

export default App;
