import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { MedicalDisclaimer } from './components/ui/MedicalDisclaimer';
import { reportEnvWarnings } from './utils/env';
import { trackEvent } from './services/analytics';
import { useAuth } from './contexts/AuthContext';
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
const NotFound = lazy(() => import('./components/NotFound'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cameroon-ivory">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const RouteAnalytics = () => {
  const location = useLocation();
  useEffect(() => {
    trackEvent('page_view', { path: location.pathname });
  }, [location.pathname]);
  return null;
};

const App = () => {
  useEffect(() => {
    reportEnvWarnings();
  }, []);

  return (
    <div className="min-h-screen">
      <RouteAnalytics />
      <MedicalDisclaimer />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-cameroon-ivory"><LoadingSpinner size="lg" message="Loading..." /></div>}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<ErrorBoundary><Landing /></ErrorBoundary>} />
            <Route path="/app" element={<ProtectedRoute><ErrorBoundary><DiagnosticHub /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/scanner" element={<ErrorBoundary><Scanner /></ErrorBoundary>} />
            <Route path="/analysis" element={<ProtectedRoute><ErrorBoundary><AnalysisResults /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/next-steps" element={<ProtectedRoute><ErrorBoundary><NextSteps /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/drugs" element={<ProtectedRoute><ErrorBoundary><DrugDatabase /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><ErrorBoundary><PatientRecords /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ErrorBoundary><Settings /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/questionnaire" element={<ProtectedRoute><ErrorBoundary><Questionnaire /></ErrorBoundary></ProtectedRoute>} />
            <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  );
};

export default App;
