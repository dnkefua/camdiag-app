import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { analyzeMedicalImage } from '../services/medgemma';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { AlertIcon, BackIcon, CheckIcon } from './ui/Icons';

const TranscriptionReview = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { transcription, pendingPages, pendingDocumentType, setPossibleFindings, setMarkers, setAnalysisError, setAnalyzing, setPendingPages, setTranscription } = useAppStore();
  const [texts, setTexts] = useState(() => transcription?.pages.map((page) => page.text) ?? []);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const uncertain = useMemo(() => transcription?.pages.flatMap((page) => page.tokens.filter((token) => token.confidence < 0.9 || token.handwritten)).slice(0, 40) ?? [], [transcription]);

  if (!transcription || pendingPages.length === 0) return <Navigate to="/scanner" replace />;

  const submit = async () => {
    if (!confirmed || submitting) return;
    setSubmitting(true); setAnalyzing(true); setAnalysisError(null);
    try {
      const confirmedTranscription = texts.map((text, index) => `[Page ${index + 1}]\n${text}`).join('\n\n');
      const result = await analyzeMedicalImage({ pages: pendingPages, confirmedTranscription, documentType: pendingDocumentType, language });
      setPossibleFindings(result.possibleFindings); setMarkers(result.markers); setPendingPages([]); setTranscription(null);
      void navigate('/analysis');
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Clinical analysis failed.');
    } finally { setSubmitting(false); setAnalyzing(false); }
  };

  return <div className="min-h-[100dvh] bg-slate-50 text-slate-900">
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-white px-4 py-3 shadow-sm"><button type="button" onClick={() => void navigate('/scanner')} aria-label="Back"><BackIcon /></button><div><h1 className="font-black text-cameroon-green">Verify transcription</h1><p className="text-xs text-slate-500">OCR text must be confirmed before clinical analysis.</p></div></header>
    <main className="mx-auto max-w-3xl space-y-5 p-4 pb-32">
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex gap-3"><AlertIcon className="shrink-0 text-amber-700"/><div><h2 className="font-black text-amber-900">{transcription.requiresReview ? 'Manual review required' : 'Review recommended'}</h2><p className="text-sm text-amber-800">Check medication names, decimal doses, units, allergies, pregnancy and pediatric instructions against the original document. Use &quot;unreadable&quot; when text cannot be confirmed.</p></div></div></section>
      {uncertain.length > 0 && <section className="rounded-2xl border bg-white p-4"><h2 className="text-sm font-black">Handwritten or low-confidence text</h2><div className="mt-3 flex flex-wrap gap-2">{uncertain.map((token, index) => <span key={`${token.pageNumber}-${index}`} className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-700" title={`${Math.round(token.confidence * 100)}% confidence`}>P{token.pageNumber}: {token.text || 'unreadable'} ({Math.round(token.confidence * 100)}%)</span>)}</div></section>}
      {transcription.pages.map((page, index) => <section key={page.pageNumber} className="rounded-2xl border bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="font-black">Page {page.pageNumber}</h2><span className={`rounded-full px-2 py-1 text-xs font-bold ${page.confidence < 0.9 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{Math.round(page.confidence * 100)}% OCR confidence</span></div>{page.qualityReasons.length > 0 && <p className="mb-3 text-xs font-bold text-amber-700">Quality: {page.qualityReasons.join(', ')}</p>}<textarea aria-label={`Verified transcription for page ${page.pageNumber}`} value={texts[index] ?? ''} onChange={(event) => setTexts((current) => current.map((text, textIndex) => textIndex === index ? event.target.value : text))} className="min-h-64 w-full rounded-xl border border-slate-300 p-3 font-mono text-sm leading-relaxed focus:border-cameroon-green focus:outline-none" /></section>)}
      <label className="flex items-start gap-3 rounded-2xl border-2 border-cameroon-green bg-green-50 p-4"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-5 w-5"/><span className="text-sm font-bold text-green-900">I compared the transcription with the source and corrected or marked all clinically important uncertain text.</span></label>
      <button type="button" disabled={!confirmed || submitting} onClick={() => void submit()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cameroon-green px-4 py-4 font-black text-white disabled:opacity-40"><CheckIcon />{submitting ? 'Analyzing verified document…' : 'Confirm and run clinical analysis'}</button>
    </main>
  </div>;
};

export default TranscriptionReview;
