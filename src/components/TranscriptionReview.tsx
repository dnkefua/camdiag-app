import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { analyzeMedicalImage } from '../services/medgemma';
import { saveScanResult } from '../services/firestore';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { AlertIcon, BackIcon, CheckIcon } from './ui/Icons';

const TranscriptionReview = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { user } = useAuth();
  const {
    transcription,
    pendingPages,
    pendingDocumentType,
    setAnalysisResult,
    analysisError,
    setAnalysisError,
    setAnalyzing,
  } = useAppStore();
  const [texts, setTexts] = useState(() => transcription?.pages.map((page) => page.text) ?? []);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const uncertain = useMemo(
    () => transcription?.pages.flatMap((page) => page.tokens.filter((token) => token.confidence < 0.9 || token.handwritten)).slice(0, 40) ?? [],
    [transcription],
  );

  if (!transcription || pendingPages.length === 0) return <Navigate to="/scanner" replace />;

  const submit = async () => {
    if (!confirmed || submitting) return;
    setSubmitting(true);
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const confirmedTranscription = texts.map((text, index) => `[Page ${index + 1}]\n${text}`).join('\n\n');
      const result = await analyzeMedicalImage({ confirmedTranscription, documentType: pendingDocumentType, language });
      setAnalysisResult(result);
      void navigate('/analysis');

      if (user?.uid) {
        const analyzedAt = result.provenance?.analyzedAt ?? new Date().toISOString();
        const scanId = `${user.uid}_${transcription.documentId}`
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 500);
        void saveScanResult(scanId, {
          userId: user.uid,
          title: result.possibleFindings[0]?.name ?? 'Clinical interpretation',
          date: new Date(analyzedAt).toLocaleString(),
          match: result.urgency === 'same_day'
            ? 'Same-day review'
            : result.urgency === 'emergency'
              ? 'Emergency review'
              : result.urgency === 'routine'
                ? 'Routine review'
                : 'Clinical review',
          type: pendingDocumentType,
          aiResponse: JSON.stringify(result),
        }).catch((error) => {
          console.error('[CamDiag] Analysis history save failed:', error);
        });
      }
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Clinical analysis failed.');
    } finally {
      setSubmitting(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex h-[100svh] h-[100dvh] flex-col overflow-hidden bg-slate-50 text-slate-900">
      <header className="safe-area-top z-20 flex shrink-0 items-center gap-3 border-b bg-white px-3 py-3 shadow-sm sm:px-4">
        <button
          type="button"
          onClick={() => void navigate('/scanner')}
          aria-label="Back"
          className="shrink-0 rounded-full p-2 text-slate-800"
        >
          <BackIcon />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black leading-tight text-cameroon-green">Verify transcription</h1>
          <p className="text-xs leading-snug text-slate-500">OCR text must be confirmed before clinical analysis.</p>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4 sm:px-4">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <section className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <AlertIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="break-words font-black leading-tight text-amber-900">
                  {transcription.requiresReview ? 'Manual review required' : 'Review recommended'}
                </h2>
                <p className="mt-1 break-words text-sm leading-relaxed text-amber-800">
                  Check medication names, decimal doses, units, allergies, pregnancy and pediatric instructions against the original
                  document. Use &quot;unreadable&quot; when text cannot be confirmed.
                </p>
              </div>
            </div>
          </section>

          {uncertain.length > 0 && (
            <section className="w-full rounded-2xl border bg-white p-4 shadow-sm">
              <h2 className="text-sm font-black">Handwritten or low-confidence text</h2>
              <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                {uncertain.map((token, index) => (
                  <span
                    key={`${token.pageNumber}-${index}`}
                    className="max-w-full break-words rounded-lg bg-red-50 px-2 py-1 text-xs font-bold leading-snug text-red-700"
                    title={`${Math.round(token.confidence * 100)}% confidence`}
                  >
                    P{token.pageNumber}: {token.text || 'unreadable'} ({Math.round(token.confidence * 100)}%)
                  </span>
                ))}
              </div>
            </section>
          )}

          {transcription.pages.map((page, index) => (
            <section key={page.pageNumber} className="w-full rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-black">Page {page.pageNumber}</h2>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
                    page.confidence < 0.9 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {Math.round(page.confidence * 100)}% OCR confidence
                </span>
              </div>
              {page.qualityReasons.length > 0 && (
                <p className="mb-3 break-words text-xs font-bold text-amber-700">Quality: {page.qualityReasons.join(', ')}</p>
              )}
              <textarea
                aria-label={`Verified transcription for page ${page.pageNumber}`}
                value={texts[index] ?? ''}
                onChange={(event) => setTexts((current) => current.map((text, textIndex) => (
                  textIndex === index ? event.target.value : text
                )))}
                className="min-h-[18rem] max-h-[60dvh] w-full max-w-full resize-y overflow-y-auto rounded-xl border border-slate-300 p-3 font-mono text-sm leading-relaxed focus:border-cameroon-green focus:outline-none"
              />
            </section>
          ))}

        </div>
      </main>

      <footer className="safe-area-bottom z-20 shrink-0 border-t border-slate-200 bg-white px-3 py-3 shadow-[0_-6px_18px_rgba(15,23,42,0.08)] sm:px-4">
        <div className="mx-auto w-full max-w-2xl space-y-2">
          {analysisError && (
            <div role="alert" className="max-h-24 overflow-y-auto rounded-lg border border-red-300 bg-red-50 px-3 py-2">
              <p className="text-xs font-black text-red-900">Interpretation did not complete</p>
              <p className="mt-0.5 break-words text-xs leading-relaxed text-red-800">{analysisError} Your transcription is still available to retry.</p>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-lg border border-cameroon-green bg-green-50 px-3 py-2.5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              <span className="min-w-0 break-words text-xs font-bold leading-relaxed text-green-900">
                I reviewed the transcription and corrected or marked clinically important uncertain text.
              </span>
            </label>

            <button
              type="button"
              disabled={!confirmed || submitting}
              onClick={() => void submit()}
              className="flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-cameroon-green px-5 py-3 text-sm font-black text-white shadow-sm disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto"
            >
              <CheckIcon />
              <span>{submitting ? 'Interpreting report...' : 'Interpret report now'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TranscriptionReview;
