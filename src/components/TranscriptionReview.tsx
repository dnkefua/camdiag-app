import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { analysisFromJob, confirmTranscription, createJob, waitForJob } from '../services/medgemma';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { clinicalLanguageNotice, clinicalText } from '../utils/clinicalLanguage';
import { getSensitiveSessionSignal } from '../services/session';

const TranscriptionReview = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { user } = useAuth();
  const store = useAppStore();
  const { transcription, pendingPages, activeEncounter, activeJob } = store;
  const [texts, setTexts] = useState(() => transcription?.pages.map((p) => p.text) ?? []);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [highlight, setHighlight] = useState<{ page: number; token: number } | null>(null);
  const request = useRef<AbortController | null>(null);
  const version = useRef(0);
  const tr = (en: string, fr: string) => clinicalText(language, en, fr);
  useEffect(() => {
    version.current++;
    const session = getSensitiveSessionSignal();
    const clear = () => {
      version.current++;
      request.current?.abort();
      setTexts([]);
      setConfirmed(false);
      setBusy(false);
      setProgress('');
      setHighlight(null);
    };
    session.addEventListener('abort', clear, { once: true });
    const cancelRequests = () => {
      version.current++;
      request.current?.abort();
    };
    return () => {
      cancelRequests();
      session.removeEventListener('abort', clear);
    };
  }, [user?.uid]);
  if (!transcription || !activeEncounter || !activeJob) return <Navigate to="/scanner" replace />;

  const submit = async () => {
    if (!confirmed || busy || !user?.canUseClinicalTools || activeJob.kind !== 'ocr') return;
    const controller = new AbortController();
    request.current = controller;
    const generation = version.current;
    const current = () => !controller.signal.aborted && generation === version.current;
    setBusy(true);
    setError(null);
    try {
      setProgress(
        tr(
          'Saving attributed transcription review…',
          'Enregistrement de la revue de transcription…'
        )
      );
      const text = texts
        .map(
          (value, index) =>
            `[Source ${transcription.pages[index]?.sourcePageId ?? 'unknown'}, page ${index + 1}]\n${value}`
        )
        .join('\n\n');
      const reviewed = await confirmTranscription(
        activeEncounter.id,
        { documentId: transcription.documentId, ocrJobId: activeJob.id, text, reviewed: true },
        controller.signal
      );
      if (!current()) return;
      const initial = await createJob(
        {
          encounterId: activeEncounter.id,
          documentId: transcription.documentId,
          kind: 'analysis',
          transcriptionId: reviewed.id,
          idempotencyKey: `analysis-${reviewed.id}`,
        },
        controller.signal
      );
      const job = await waitForJob(initial, controller.signal, (j) => {
        if (current()) setProgress(`${tr('Interpretation', 'Interprétation')}: ${j.status}`);
      });
      if (!current()) return;
      store.setActiveJob(job);
      store.setAnalysisResult(analysisFromJob(job));
      store.setActiveEncounter({
        ...activeEncounter,
        status: 'review_required',
        latestTranscriptionId: reviewed.id,
        latestAnalysisId: job.resultId,
      });
      void navigate('/analysis');
    } catch (e) {
      if (current()) setError(e instanceof Error ? e.message : 'Interpretation failed.');
    } finally {
      if (current()) {
        setBusy(false);
        setProgress('');
      }
    }
  };
  return (
    <div className="screen-safe overflow-y-auto bg-slate-50 text-slate-900">
      <header className="safe-area-top flex items-center gap-3 border-b bg-white p-4">
        <button type="button" onClick={() => navigate('/patients')} className="rounded border p-2">
          {tr('Records', 'Dossiers')}
        </button>
        <h1 className="text-xl font-black text-cameroon-green">
          {tr('Verify transcription', 'Vérifier la transcription')}
        </h1>
      </header>
      <main className="mx-auto max-w-6xl space-y-4 p-4 pb-10">
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          {clinicalLanguageNotice(language)}
        </p>
        <p className="text-sm">
          {tr('Patient', 'Patient')}: {activeEncounter.patientId} ·{' '}
          {tr('Encounter', 'Consultation')}: {activeEncounter.id}
        </p>
        <p className="rounded bg-amber-50 p-4 text-sm">
          {tr(
            'Compare every page to its original. Correct medication names, decimals, units and allergy information. Write “unreadable” for anything you cannot verify. Highlighted OCR confidence is not clinical confidence.',
            'Comparez chaque page à l’original. Corrigez les noms de médicaments, décimales, unités et allergies. Écrivez « illisible » si une information ne peut pas être vérifiée. La confiance OCR n’est pas une confiance clinique.'
          )}
        </p>
        {transcription.pages.map((page, index) => {
          const source = pendingPages.find((p) => p.id === page.sourcePageId);
          const selected = highlight?.page === index ? page.tokens[highlight.token] : undefined;
          return (
            <section
              key={`${page.sourcePageId}-${page.pageNumber}`}
              className="rounded-2xl border bg-white p-4"
            >
              <h2 className="mb-3 font-black">
                {tr('Page', 'Page')} {page.pageNumber} ·{' '}
                <span className="font-normal text-xs">{source?.fileName ?? page.sourcePageId}</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  {source ? (
                    <div className="relative">
                      <img
                        src={source.contentBase64}
                        alt={`${tr('Original page', 'Page originale')} ${page.pageNumber}`}
                        className="w-full"
                      />
                      {selected?.boundingBox && (
                        <svg
                          viewBox="0 0 1 1"
                          preserveAspectRatio="none"
                          className="pointer-events-none absolute inset-0 h-full w-full"
                          aria-hidden="true"
                        >
                          <polygon
                            points={selected.boundingBox.map((p) => `${p.x},${p.y}`).join(' ')}
                            fill="rgba(250,204,21,0.35)"
                            stroke="red"
                            strokeWidth="0.004"
                          />
                        </svg>
                      )}
                    </div>
                  ) : (
                    <p role="alert" className="rounded bg-red-50 p-3 text-red-900">
                      {tr(
                        'Original source is unavailable or expired. Retrieve it through your approved clinical process before confirming this text.',
                        'La source originale est indisponible ou expirée. Récupérez-la via votre procédure clinique avant de confirmer ce texte.'
                      )}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-bold">
                    {tr('Corrected transcription', 'Transcription corrigée')}
                    <textarea
                      aria-label={`Verified transcription for page ${page.pageNumber}`}
                      disabled={busy}
                      value={texts[index] ?? ''}
                      onChange={(e) => {
                        setTexts((all) =>
                          all.map((text, i) => (i === index ? e.target.value : text))
                        );
                        setConfirmed(false);
                      }}
                      className="mt-2 min-h-80 w-full rounded border p-3 font-mono text-sm"
                    />
                  </label>
                  <p className="text-xs">
                    OCR: {Math.round(page.confidence * 100)}% · {page.qualityReasons.join(', ')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {page.tokens.map(
                      (token, tokenIndex) =>
                        (token.confidence < 0.9 || token.handwritten) && (
                          <button
                            type="button"
                            key={tokenIndex}
                            onClick={() => setHighlight({ page: index, token: tokenIndex })}
                            className="rounded border border-amber-300 bg-amber-50 p-2 text-xs"
                            aria-label={`Highlight ${token.text} on page ${page.pageNumber}`}
                          >
                            {token.text || 'unreadable'} ({Math.round(token.confidence * 100)}%)
                          </button>
                        )
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
        <label className="flex gap-3 rounded border bg-white p-4">
          <input
            type="checkbox"
            checked={confirmed}
            disabled={
              busy ||
              transcription.pages.some(
                (page) => !pendingPages.some((source) => source.id === page.sourcePageId)
              )
            }
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span className="text-sm">
            {tr(
              'I compared the text with every source page and corrected or marked uncertain text. This review will be attributed to my account.',
              'J’ai comparé le texte à chaque source et corrigé ou marqué les passages incertains. Cette revue sera attribuée à mon compte.'
            )}
          </span>
        </label>
        {error && (
          <p role="alert" className="rounded bg-red-50 p-3 text-red-900">
            {error}
          </p>
        )}
        {progress && <p role="status">{progress}</p>}
        {busy ? (
          <button
            type="button"
            onClick={() => {
              request.current?.abort();
              setBusy(false);
              setProgress('');
              setError(
                tr(
                  'Stopped waiting. Any queued job remains saved. Reopen this encounter from records.',
                  'Attente arrêtée. Les tâches restent enregistrées. Rouvrez cette consultation depuis les dossiers.'
                )
              );
            }}
            className="w-full rounded border p-3"
          >
            {tr('Stop waiting', 'Arrêter l’attente')}
          </button>
        ) : (
          <button
            type="button"
            disabled={!confirmed || !user?.canUseClinicalTools}
            onClick={() => void submit()}
            className="w-full rounded bg-cameroon-green p-4 font-black text-white disabled:opacity-40"
          >
            {tr('Save review and interpret report', 'Enregistrer la revue et interpréter')}
          </button>
        )}
      </main>
    </div>
  );
};
export default TranscriptionReview;
