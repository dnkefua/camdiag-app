import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useAppStore';
import {
  analysisFromJob,
  getEncounter,
  listEncounters,
  loadSourcePage,
  transcriptionFromJob,
  waitForJob,
} from '../services/medgemma';
import { clinicalText } from '../utils/clinicalLanguage';
import { getSensitiveSessionSignal } from '../services/session';
import type { Encounter } from '../../functions/src/contracts/clinical';
const readBlob = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Source preview unavailable.'));
    r.readAsDataURL(blob);
  });

const PatientRecords = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { user } = useAuth();
  const store = useAppStore();
  const [items, setItems] = useState<Encounter[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const request = useRef<AbortController | null>(null);
  const version = useRef(0);
  const tr = (en: string, fr: string) => clinicalText(language, en, fr);
  const load = async (cursor?: string) => {
    const signal = request.current?.signal;
    if (!signal || !user?.uid) return;
    setLoading(true);
    setError(null);
    const generation = version.current;
    try {
      const page = await listEncounters(cursor, signal);
      if (signal.aborted || generation !== version.current) return;
      setItems((old) => (cursor ? [...old, ...page.items] : page.items));
      setNext(page.nextCursor);
    } catch (e) {
      if (!signal.aborted && generation === version.current) {
        if (!cursor) setItems([]);
        setError(e instanceof Error ? e.message : 'Records could not be loaded.');
      }
    } finally {
      if (!signal.aborted && generation === version.current) setLoading(false);
    }
  };
  useEffect(() => {
    version.current++;
    const controller = new AbortController();
    request.current = controller;
    const session = getSensitiveSessionSignal();
    const clear = () => {
      version.current++;
      controller.abort();
      setItems([]);
      setNext(null);
      setQuery('');
      setStatus('');
      setLoading(false);
    };
    session.addEventListener('abort', clear, { once: true });
    setItems([]);
    setNext(null);
    setError(null);
    setStatus('');
    setLoading(false);
    if (user?.uid && user.canUseClinicalTools) void load();
    return () => {
      controller.abort();
      session.removeEventListener('abort', clear);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, user?.canUseClinicalTools]);
  const open = async (encounter: Encounter) => {
    const signal = request.current?.signal;
    if (!signal) return;
    const generation = version.current;
    const current = () => !signal.aborted && generation === version.current;
    setLoading(true);
    setError(null);
    setStatus(tr('Opening saved encounter…', 'Ouverture de la consultation…'));
    try {
      let detail = await getEncounter(encounter.id, signal);
      if (!current()) return;
      store.resetAnalysis();
      store.setPendingPages([]);
      store.setTranscription(null);
      store.setActiveJob(null);
      store.setActiveEncounter(detail.encounter);
      const pending = detail.jobs?.find(
        (job) => job.status === 'queued' || job.status === 'running'
      );
      let job = pending;
      if (pending) {
        job = await waitForJob(pending, signal, (j) => {
          if (current()) {
            store.setActiveJob(j);
            setStatus(`${j.kind}: ${j.status}`);
          }
        });
        detail = await getEncounter(encounter.id, signal);
      }
      if (!current()) return;
      const analysis = detail.analyses.find((a) => a.id === detail.encounter.latestAnalysisId);
      if (analysis) {
        store.setAnalysisResult(analysis.result);
        store.setActiveJob(detail.jobs?.find((j) => j.resultId === analysis.id) ?? null);
        void navigate('/analysis');
        return;
      }
      if (job?.kind === 'analysis' && job.status === 'succeeded') {
        store.setAnalysisResult(analysisFromJob(job));
        store.setActiveJob(job);
        void navigate('/analysis');
        return;
      }
      const ocr = detail.jobs?.find((j) => j.kind === 'ocr' && j.status === 'succeeded');
      if (ocr) {
        const transcription = transcriptionFromJob(ocr);
        const document = detail.documents.find((d) => d.id === ocr.documentId);
        const pages = await Promise.all(
          (document?.pages ?? []).map(async (p) => {
            try {
              return {
                id: p.id,
                fileName: p.fileName,
                mimeType: p.mimeType,
                contentBase64: await readBlob(await loadSourcePage(p.storagePath)),
              };
            } catch {
              return null;
            }
          })
        );
        if (!current()) return;
        store.setPendingPages(pages.filter((p): p is NonNullable<typeof p> => p !== null));
        store.setPendingDocumentType(encounter.documentType);
        store.setTranscription(transcription);
        store.setActiveJob(ocr);
        void navigate('/transcription-review');
        return;
      }
      setStatus(
        tr(
          'No completed processing yet. Reselect source files to resume the upload.',
          'Aucun traitement terminé. Sélectionnez les fichiers sources pour reprendre le transfert.'
        )
      );
      void navigate(`/scanner?resume=${encodeURIComponent(encounter.id)}`);
    } catch (e) {
      if (current())
        setError(e instanceof Error ? e.message : 'The encounter could not be opened.');
    } finally {
      if (current()) setLoading(false);
    }
  };
  return (
    <div className="screen-safe overflow-y-auto bg-slate-50 text-slate-900">
      <header className="safe-area-top flex items-center justify-between border-b bg-white p-4">
        <h1 className="text-xl font-black text-cameroon-green">
          {tr('Patient encounters', 'Consultations des patients')}
        </h1>
        <button onClick={() => void navigate('/app')} className="rounded border p-2">
          {tr('Home', 'Accueil')}
        </button>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 p-4 pb-12">
        <p className="text-sm">
          {tr(
            'Saved clinical records are scoped to your approved account and organization. Review status is distinct from diagnosis.',
            'Les dossiers sont limités à votre compte et organisation autorisés. Le statut de revue est distinct du diagnostic.'
          )}
        </p>
        <button
          onClick={() => {
            store.setActiveEncounter(null);
            store.setActiveJob(null);
            void navigate('/scanner');
          }}
          className="rounded bg-cameroon-green p-3 font-bold text-white"
        >
          {tr('New patient encounter', 'Nouvelle consultation')}
        </button>
        <label className="block">
          {tr('Filter loaded patient references', 'Filtrer les références chargées')}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-1 w-full rounded border p-3"
          />
        </label>
        {loading && <p role="status">{status || tr('Loading records…', 'Chargement…')}</p>}
        {error && (
          <div role="alert" className="rounded bg-red-50 p-3 text-red-900">
            <p>{error}</p>
            <button onClick={() => void load()} className="underline">
              {tr('Retry', 'Réessayer')}
            </button>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <p>{tr('No saved encounters yet.', 'Aucune consultation enregistrée.')}</p>
        )}
        {items
          .filter((item) => item.patientId.toLowerCase().includes(query.toLowerCase()))
          .map((item) => (
            <article key={item.id} className="rounded-xl border bg-white p-4 space-y-2">
              <h2 className="font-black">{item.patientId}</h2>
              <p className="text-xs break-all">
                {item.id} · {new Date(item.createdAt).toLocaleString()}
              </p>
              <p className="text-sm">
                {item.documentType} · {item.status}
              </p>
              <p className="text-sm">
                {tr('Referral', 'Orientation')}: {item.referralStatus}
              </p>
              <button
                disabled={loading}
                onClick={() => void open(item)}
                className="rounded border border-cameroon-green px-4 py-2 font-bold text-cameroon-green disabled:opacity-40"
              >
                {tr('Open / resume encounter', 'Ouvrir / reprendre la consultation')}
              </button>
            </article>
          ))}
        {next && (
          <button disabled={loading} onClick={() => void load(next)} className="rounded border p-3">
            {tr('Load more', 'Charger plus')}
          </button>
        )}
      </main>
    </div>
  );
};
export default PatientRecords;
