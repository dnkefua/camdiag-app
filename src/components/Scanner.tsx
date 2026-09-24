import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useCamera } from '../hooks/useCamera';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useAppStore';
import {
  createDocument,
  createEncounter,
  createJob,
  getEncounter,
  loadSourcePage,
  sha256,
  transcriptionFromJob,
  uploadClinicalPage,
  waitForJob,
} from '../services/medgemma';
import { getSensitiveSessionSignal } from '../services/session';
import { validateImageQuality } from '../utils/imageQuality';
import { ACCEPTED_DOCUMENT_TYPES, validateDocumentFiles } from '../utils/documentLimits';
import { clinicalLanguage, clinicalLanguageNotice, clinicalText } from '../utils/clinicalLanguage';
import type {
  ClinicalDocumentType,
  DocumentManifest,
  Encounter,
  PatientContext,
  UploadPageInput,
} from '../../functions/src/contracts/clinical';

type Capture = {
  id: string;
  dataUrl: string;
  blob: Blob;
  fileName: string;
  mimeType: UploadPageInput['mimeType'];
};
const readBlob = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(blob);
  });
const list = (value: string) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const Scanner = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('resume');
  const { language, t } = useTranslation();
  const { user } = useAuth();
  const camera = useCamera();
  const store = useAppStore();
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [documentType, setDocumentType] = useState<ClinicalDocumentType>('lab_result');
  const [patientId, setPatientId] = useState(store.activeEncounter?.patientId ?? '');
  const [ageRange, setAgeRange] = useState('');
  const [sex, setSex] = useState<PatientContext['sexAtBirth']>('unknown');
  const [pregnancy, setPregnancy] = useState<PatientContext['pregnancyStatus']>('unknown');
  const [symptoms, setSymptoms] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [triage, setTriage] = useState<'unchecked' | 'no_red_flags' | 'emergency'>('unchecked');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hydrating, setHydrating] = useState(Boolean(resumeId));
  const [cameraShown, setCameraShown] = useState(false);
  const [resume, setResume] = useState<Encounter | null>(null);
  const manifest = useRef<DocumentManifest | null>(null);
  const request = useRef<AbortController | null>(null);
  const version = useRef(0);
  const tr = (en: string, fr: string) => clinicalText(language, en, fr);

  useEffect(() => {
    version.current += 1;
    const signal = getSensitiveSessionSignal();
    const clear = () => {
      version.current++;
      request.current?.abort();
      camera.stop();
      setCaptures([]);
      setResume(null);
      manifest.current = null;
      setPatientId('');
      setAgeRange('');
      setSymptoms('');
      setAllergies('');
      setMedications('');
      setSex('unknown');
      setPregnancy('unknown');
      setTriage('unchecked');
      setBusy(false);
      setProgress('');
      setError('Clinical session ended. Sign in again before processing.');
    };
    signal.addEventListener('abort', clear, { once: true });
    return () => {
      version.current += 1;
      signal.removeEventListener('abort', clear);
      request.current?.abort();
      camera.stop();
    };
    // Camera hook callbacks vary; cleanup is keyed to identity only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useEffect(() => {
    if (!resumeId || !user?.uid) {
      setHydrating(false);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setHydrating(true);
    setError(null);
    getEncounter(resumeId, controller.signal)
      .then((detail) => {
        if (controller.signal.aborted) return;
        const encounter = detail.encounter;
        if (encounter.latestAnalysisId) {
          store.setActiveEncounter(encounter);
          void navigate('/analysis');
          return;
        }
        if (detail.jobs.some((j) => j.status === 'queued' || j.status === 'running')) {
          void navigate('/patients');
          return;
        }
        setResume(encounter);
        store.setActiveEncounter(encounter);
        setPatientId(encounter.patientId);
        setDocumentType(encounter.documentType);
        setTriage(encounter.triage);
        const context = encounter.patientContext;
        setAgeRange(context.ageRange ?? '');
        setSex(context.sexAtBirth ?? 'unknown');
        setPregnancy(context.pregnancyStatus ?? 'unknown');
        setSymptoms(context.symptoms?.join(', ') ?? '');
        setAllergies(context.allergies?.join(', ') ?? '');
        setMedications(context.currentMedications?.join(', ') ?? '');
        manifest.current =
          detail.documents.find(
            (document) => new Date(document.expiresAt).getTime() > Date.now()
          ) ?? null;
        setCaptures([]);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'The saved encounter could not be restored.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setHydrating(false);
      });
    return () => controller.abort();
    // Store methods are stable; this hydration must only rerun for identity or URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId, user?.uid]);

  const addFiles = async (files: File[]) => {
    if (manifest.current && captures.length + files.length > manifest.current.pages.length) {
      setError(
        'Reselect the original source pages in the same order. Start a new encounter for different documents.'
      );
      return;
    }
    const invalid = validateDocumentFiles(
      captures.map((c) => c.blob),
      files
    );
    if (invalid) {
      setError(invalid);
      return;
    }
    const generation = version.current;
    try {
      const added = await Promise.all(
        files.map(async (file) => ({
          id: crypto.randomUUID(),
          dataUrl: await readBlob(file),
          blob: file,
          fileName: file.name,
          mimeType: file.type as Capture['mimeType'],
        }))
      );
      if (version.current !== generation) return;
      setCaptures((previous) => {
        const raced = validateDocumentFiles(
          previous.map((c) => c.blob),
          files
        );
        if (raced) {
          setError(raced);
          return previous;
        }
        return [...previous, ...added];
      });
      setError(null);
    } catch {
      if (version.current === generation)
        setError('The image could not be read. Please choose it again.');
    }
  };
  const capture = async () => {
    const generation = version.current;
    const shot = await camera.capture();
    if (shot && version.current === generation)
      await addFiles([
        new File([shot.blob], `camera-page-${captures.length + 1}.jpg`, { type: 'image/jpeg' }),
      ]);
  };

  const process = async () => {
    if (
      busy ||
      hydrating ||
      (resumeId && !resume) ||
      !patientId.trim() ||
      triage === 'unchecked' ||
      !user?.canUseClinicalTools
    )
      return;
    const controller = new AbortController();
    request.current = controller;
    const generation = version.current;
    const current = () => !controller.signal.aborted && version.current === generation;
    setBusy(true);
    setError(null);
    try {
      if (triage !== 'emergency') {
        const bounds = validateDocumentFiles(
          [],
          captures.map((c) => ({ size: c.blob.size, type: c.mimeType }))
        );
        if (bounds || !captures.length)
          throw new Error(bounds ?? 'Select at least one source page.');
        setProgress(tr('Checking image quality…', 'Vérification de la qualité…'));
        for (const c of captures) {
          const quality = await validateImageQuality(c.dataUrl);
          if (!quality.ok) throw new Error(`${c.fileName}: ${quality.issues.join(' ')}`);
        }
      }
      if (!current()) return;
      const encounter =
        resume ??
        (await createEncounter(
          {
            patientId: patientId.trim(),
            documentType,
            language: clinicalLanguage(language),
            patientContext: {
              ageRange: ageRange || undefined,
              sexAtBirth: sex,
              pregnancyStatus: pregnancy,
              symptoms: list(symptoms),
              allergies: list(allergies),
              currentMedications: list(medications),
            },
            triage,
          },
          controller.signal
        ));
      if (!current()) return;
      setResume(encounter);
      store.setActiveEncounter(encounter);
      store.resetAnalysis();
      if (encounter.triage === 'emergency') {
        setError(
          tr(
            'Emergency warning signs recorded. Stop this workflow and arrange urgent clinical care. No AI processing will run.',
            'Signes d’urgence enregistrés. Arrêtez ce parcours et organisez des soins urgents. Aucun traitement IA ne sera lancé.'
          )
        );
        return;
      }
      setProgress(tr('Preparing private source upload…', 'Préparation du transfert privé…'));
      const pages: UploadPageInput[] = await Promise.all(
        captures.map(async (c) => ({
          id: c.id,
          fileName: c.fileName,
          mimeType: c.mimeType,
          sizeBytes: c.blob.size,
          sha256: await sha256(c.blob),
        }))
      );
      if (!current()) return;
      if (!manifest.current) {
        const existing = await getEncounter(encounter.id, controller.signal);
        manifest.current =
          existing.documents.find(
            (d) =>
              d.pages.length === pages.length &&
              d.pages.every((p, i) => p.sha256 === pages[i]?.sha256) &&
              new Date(d.expiresAt).getTime() > Date.now()
          ) ?? (await createDocument(encounter.id, pages, controller.signal));
      }
      const source = manifest.current;
      if (source.pages.length !== captures.length)
        throw new Error(
          `Reselect all ${source.pages.length} original pages in their original order.`
        );
      for (let i = 0; i < captures.length; i++) {
        const selected = captures[i];
        const page = source.pages[i];
        if (!selected || !page || page.sha256 !== pages[i]?.sha256)
          throw new Error('Selected sources changed. Start a new encounter.');
        let uploaded = false;
        try {
          const existing = await loadSourcePage(page.storagePath);
          uploaded =
            existing.size === selected.blob.size && (await sha256(existing)) === page.sha256;
          if (!uploaded)
            throw new Error(
              'Existing source differs from the saved manifest. Start a new encounter.'
            );
        } catch (e) {
          if (e instanceof Error && e.message.startsWith('Existing source differs')) throw e;
          if (!current()) return;
        }
        if (uploaded) continue;
        await uploadClinicalPage(page.storagePath, selected.blob, controller.signal, (percent) => {
          if (current())
            setProgress(
              `${tr('Uploading page', 'Transfert page')} ${i + 1}/${captures.length}: ${percent}%`
            );
        });
      }
      if (!current()) return;
      store.setPendingPages(
        captures.map((c, i) => ({
          id: source.pages[i]!.id,
          fileName: c.fileName,
          mimeType: c.mimeType,
          contentBase64: c.dataUrl,
        }))
      );
      store.setPendingDocumentType(encounter.documentType);
      const existingJobs = await getEncounter(encounter.id, controller.signal);
      const prior = existingJobs.jobs.find(
        (job) => job.kind === 'ocr' && job.documentId === source.id && job.status !== 'failed'
      );
      const initial =
        prior ??
        (await createJob(
          {
            encounterId: encounter.id,
            documentId: source.id,
            kind: 'ocr',
            idempotencyKey: `ocr-${source.id}-${existingJobs.jobs.filter((job) => job.kind === 'ocr' && job.documentId === source.id).length}`,
          },
          controller.signal
        ));
      const job = await waitForJob(initial, controller.signal, (j) => {
        if (current()) {
          store.setActiveJob(j);
          setProgress(`${tr('Text extraction', 'Extraction du texte')}: ${j.status}`);
        }
      });
      if (!current()) return;
      store.setTranscription(transcriptionFromJob(job));
      camera.stop();
      void navigate('/transcription-review');
    } catch (e) {
      if (current())
        setError(e instanceof Error ? e.message : 'Document processing did not complete.');
    } finally {
      if (current()) {
        setBusy(false);
        setProgress('');
      }
    }
  };
  const stop = () => {
    request.current?.abort();
    setBusy(false);
    setProgress('');
    setError(
      tr(
        'Stopped waiting. Uploaded sources and queued jobs remain saved; reopen the encounter from records. Incomplete uploads can be retried with the same files.',
        'Attente arrêtée. Les sources transférées et les tâches restent enregistrées ; rouvrez la consultation depuis les dossiers.'
      )
    );
  };

  return (
    <div className="screen-safe bg-slate-50 text-slate-900 overflow-y-auto">
      <header className="safe-area-top flex items-center justify-between border-b bg-white p-4">
        <h1 className="text-xl font-black text-cameroon-green">{t.camdiag_scan}</h1>
        <button type="button" onClick={() => navigate('/app')} className="rounded border px-3 py-2">
          {tr('Back to hub', 'Retour')}
        </button>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 p-4 pb-12">
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
          {clinicalLanguageNotice(language)}
        </p>
        {hydrating && (
          <p role="status">
            {tr('Restoring saved encounter…', 'Restauration de la consultation…')}
          </p>
        )}
        {!user?.canUseClinicalTools && (
          <p role="alert">
            {tr('Verified clinician access is required.', 'Un accès clinicien vérifié est requis.')}
          </p>
        )}
        <section className="rounded-2xl border bg-white p-4 space-y-3">
          <h2 className="font-black">{tr('Patient and encounter', 'Patient et consultation')}</h2>
          {resume && (
            <p role="status" className="text-sm">
              {tr('Saved encounter', 'Consultation enregistrée')}: {resume.id}
            </p>
          )}
          <label className="block text-sm font-bold">
            {tr(
              'Patient reference (clinic ID; avoid full names)',
              'Référence patient (identifiant de clinique)'
            )}
            <input
              disabled={Boolean(resume) || busy}
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              maxLength={100}
              className="mt-1 w-full rounded border p-2"
            />
          </label>
          <button type="button" onClick={() => navigate('/patients')} className="text-sm underline">
            {tr(
              'Select or reopen an existing patient encounter',
              'Choisir ou rouvrir une consultation'
            )}
          </button>
          <label className="block text-sm font-bold">
            {tr('Document type', 'Type de document')}
            <select
              disabled={Boolean(resume) || busy}
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as ClinicalDocumentType)}
              className="ml-3 rounded border p-2"
            >
              <option value="lab_result">{tr('Lab result', 'Résultat de laboratoire')}</option>
              <option value="prescription">
                {tr('Prescription document', 'Document d’ordonnance')}
              </option>
              <option value="medical_document">
                {tr('Medical text document', 'Document médical textuel')}
              </option>
              <option value="xray" disabled>
                X-ray — unavailable
              </option>
              <option value="rdt" disabled>
                RDT image — unavailable
              </option>
            </select>
          </label>
          <p className="text-xs text-slate-600">
            {tr(
              'X-ray, test-strip and body-image interpretation are unavailable. This workflow reviews document text only.',
              'L’interprétation de radiographies, bandelettes et photos corporelles est indisponible. Ce parcours examine uniquement le texte des documents.'
            )}
          </p>
          <fieldset disabled={busy || Boolean(resume)} className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-bold">
              {tr(
                'Patient context (unknown if not supplied)',
                'Contexte patient (inconnu si non renseigné)'
              )}
            </legend>
            <label>
              {tr('Age / age range', 'Âge / tranche d’âge')}
              <input
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                maxLength={100}
                className="w-full rounded border p-2"
              />
            </label>
            <label>
              {tr('Sex at birth', 'Sexe à la naissance')}
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as PatientContext['sexAtBirth'])}
                className="w-full rounded border p-2"
              >
                <option value="unknown">{tr('Unknown', 'Inconnu')}</option>
                <option value="female">{tr('Female', 'Féminin')}</option>
                <option value="male">{tr('Male', 'Masculin')}</option>
              </select>
            </label>
            <label>
              {tr('Pregnancy status', 'Grossesse')}
              <select
                value={pregnancy}
                onChange={(e) => setPregnancy(e.target.value as PatientContext['pregnancyStatus'])}
                className="w-full rounded border p-2"
              >
                <option value="unknown">{tr('Unknown', 'Inconnue')}</option>
                <option value="pregnant">{tr('Pregnant', 'Enceinte')}</option>
                <option value="not_pregnant">{tr('Not pregnant', 'Non enceinte')}</option>
              </select>
            </label>
            <label>
              {tr('Symptoms (comma separated)', 'Symptômes (séparés par virgules)')}
              <input
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                maxLength={1500}
                className="w-full rounded border p-2"
              />
            </label>
            <label>
              {tr('Allergies (comma separated)', 'Allergies (séparées par virgules)')}
              <input
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                maxLength={1500}
                className="w-full rounded border p-2"
              />
            </label>
            <label>
              {tr(
                'Current medicines (comma separated)',
                'Médicaments actuels (séparés par virgules)'
              )}
              <input
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                maxLength={1500}
                className="w-full rounded border p-2"
              />
            </label>
          </fieldset>
        </section>
        <section className="space-y-3 rounded-2xl border bg-white p-4">
          <h2 className="font-black">{tr('Source pages', 'Pages sources')}</h2>
          <label className="block rounded-xl bg-cameroon-green p-3 text-center font-bold text-white cursor-pointer">
            {tr('Upload document images', 'Importer les images du document')}
            <input
              aria-label="Upload document images"
              type="file"
              accept={ACCEPTED_DOCUMENT_TYPES.join(',')}
              multiple
              disabled={
                busy ||
                hydrating ||
                Boolean(manifest.current && captures.length >= manifest.current.pages.length)
              }
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                void addFiles(files);
              }}
              className="mt-2 block w-full text-sm"
            />
          </label>
          {manifest.current && (
            <p className="text-xs">
              {tr('Saved source order', 'Ordre des sources enregistrées')}:{' '}
              {manifest.current.pages.map((p) => p.fileName).join(' → ')}.{' '}
              <button
                type="button"
                disabled={busy}
                onClick={() => setCaptures([])}
                className="underline"
              >
                {tr('Reselect the same pages', 'Sélectionner à nouveau les mêmes pages')}
              </button>
            </p>
          )}
          <p className="text-xs">
            {tr(
              'JPEG, PNG, WebP; at most 15 pages, 6 MiB per page, 24 MiB total. PDF/TIFF are not yet supported. Upload works without camera access.',
              'JPEG, PNG, WebP ; 15 pages maximum, 6 Mio par page, 24 Mio au total. PDF/TIFF non pris en charge. Import possible sans caméra.'
            )}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setCameraShown(true);
              void camera.start();
            }}
            className="rounded border px-4 py-2"
          >
            {tr('Use camera', 'Utiliser la caméra')}
          </button>
          {cameraShown && (
            <div className="space-y-2">
              <video
                ref={camera.videoRef}
                autoPlay
                playsInline
                muted
                className="max-h-80 w-full rounded-xl bg-black"
              />
              {camera.error && (
                <p role="status" className="text-sm text-amber-800">
                  {tr(
                    'Camera unavailable. You can still upload images above.',
                    'Caméra indisponible. Vous pouvez importer des images ci-dessus.'
                  )}
                </p>
              )}
              <button
                type="button"
                disabled={!camera.isReady || busy}
                onClick={() => void capture()}
                className="rounded bg-cameroon-green px-4 py-2 text-white disabled:opacity-50"
              >
                {tr('Capture page', 'Capturer une page')}
              </button>
            </div>
          )}
          <ul className="flex gap-3 overflow-x-auto">
            {captures.map((c, i) => (
              <li key={c.id} className="w-32 shrink-0 rounded border p-2">
                <img
                  src={c.dataUrl}
                  alt={`Source page ${i + 1}`}
                  className="h-24 w-full object-contain"
                />
                <p className="truncate text-xs">{c.fileName}</p>
                <button
                  type="button"
                  disabled={busy || Boolean(manifest.current)}
                  onClick={() => setCaptures((items) => items.filter((item) => item.id !== c.id))}
                  className="text-xs underline"
                >
                  {tr('Remove', 'Retirer')}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
          <h2 className="font-black text-red-900">
            {tr('Emergency check', 'Vérification d’urgence')}
          </h2>
          <p className="text-sm">
            {tr(
              'Severe breathing trouble, chest pain, heavy bleeding, seizure, confusion, unconsciousness, severe allergic reaction or any other emergency warning sign?',
              'Difficulté respiratoire sévère, douleur thoracique, hémorragie, convulsion, confusion, inconscience, réaction allergique sévère ou autre signe d’urgence ?'
            )}
          </p>
          <select
            aria-label="Emergency check"
            disabled={busy || Boolean(resume)}
            value={triage}
            onChange={(e) => setTriage(e.target.value as typeof triage)}
            className="w-full rounded border p-3"
          >
            <option value="unchecked">
              {tr('Select after clinical assessment', 'Choisir après évaluation clinique')}
            </option>
            <option value="emergency">
              {tr('Emergency signs — urgent care', 'Signes d’urgence — soins urgents')}
            </option>
            <option value="no_red_flags">
              {tr('No emergency signs reported', 'Aucun signe d’urgence signalé')}
            </option>
          </select>
        </section>
        {error && (
          <p
            role="alert"
            className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900"
          >
            {error}
          </p>
        )}
        {progress && (
          <p role="status" aria-live="polite" className="rounded bg-blue-50 p-3 font-bold">
            {progress}
          </p>
        )}
        {busy ? (
          <button type="button" onClick={stop} className="w-full rounded border p-3">
            {tr('Cancel upload / stop waiting', 'Annuler le transfert / arrêter l’attente')}
          </button>
        ) : (
          <button
            type="button"
            disabled={
              hydrating ||
              Boolean(resumeId && !resume) ||
              !user?.canUseClinicalTools ||
              !patientId.trim() ||
              triage === 'unchecked' ||
              (!captures.length && triage !== 'emergency')
            }
            onClick={() => void process()}
            className="w-full rounded-xl bg-cameroon-green p-4 font-black text-white disabled:opacity-40"
          >
            {triage === 'emergency'
              ? tr('Record emergency — no AI', 'Enregistrer l’urgence — sans IA')
              : tr('Save sources and extract text', 'Enregistrer les sources et extraire le texte')}
          </button>
        )}
      </main>
    </div>
  );
};
export default Scanner;
