import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { getEncounter, signClinicalReview } from '../services/medgemma';
import { getSensitiveSessionSignal } from '../services/session';
import { clinicalLanguageNotice, clinicalText } from '../utils/clinicalLanguage';
import type { EncounterDetail, ReviewInput } from '../../functions/src/contracts/clinical';

const AnalysisResults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, t } = useTranslation();
  const { activeEncounter, activeJob, setActiveEncounter, setAnalysisResult } = useAppStore();
  const [detail, setDetail] = useState<EncounterDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attested, setAttested] = useState(false);
  const [notes, setNotes] = useState('');
  const [disposition, setDisposition] = useState<ReviewInput['disposition']>('accepted');
  const controller = useRef<AbortController | null>(null);
  const version = useRef(0);
  const tr = (en: string, fr: string) => clinicalText(language, en, fr);
  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    version.current++;
    const session = getSensitiveSessionSignal();
    const clear = () => {
      version.current++;
      abort.abort();
      setDetail(null);
      setNotes('');
      setAttested(false);
      setBusy(false);
      setLoading(false);
    };
    session.addEventListener('abort', clear, { once: true });
    setDetail(null);
    setError(null);
    setLoading(true);
    setAttested(false);
    setNotes('');
    if (!activeEncounter || !user?.uid) {
      setLoading(false);
      return () => {
        abort.abort();
        session.removeEventListener('abort', clear);
      };
    }
    getEncounter(activeEncounter.id, abort.signal)
      .then((value) => {
        if (!abort.signal.aborted) setDetail(value);
      })
      .catch((e: unknown) => {
        if (!abort.signal.aborted)
          setError(e instanceof Error ? e.message : 'Saved report could not be loaded.');
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => {
      abort.abort();
      session.removeEventListener('abort', clear);
    };
  }, [activeEncounter?.id, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const saved =
    detail?.analyses.find((a) => a.id === activeJob?.resultId) ??
    detail?.analyses.find((a) => a.id === detail.encounter.latestAnalysisId) ??
    detail?.analyses[0];
  const report = saved?.result;
  const relatedReviews = detail?.reviews.filter((r) => r.analysisId === saved?.id) ?? [];
  const review = relatedReviews[0];
  const sign = async () => {
    if (!detail || !saved || !attested || busy || !user?.canUseClinicalTools || !controller.current)
      return;
    const signal = controller.current.signal;
    const generation = version.current;
    setBusy(true);
    setError(null);
    try {
      await signClinicalReview(
        detail.encounter.id,
        { analysisId: saved.id, attested: true, disposition, notes },
        signal
      );
      const fresh = await getEncounter(detail.encounter.id, signal);
      if (signal.aborted || generation !== version.current) return;
      setDetail(fresh);
      setActiveEncounter(fresh.encounter);
      setAnalysisResult(saved.result);
      setAttested(false);
    } catch (e) {
      if (!signal.aborted && generation === version.current)
        setError(e instanceof Error ? e.message : 'Review was not saved.');
    } finally {
      if (!signal.aborted && generation === version.current) setBusy(false);
    }
  };
  return (
    <div className="clinical-report screen-safe overflow-y-auto bg-slate-50 text-slate-900">
      <style>
        {
          '@media print { .print-hidden { display:none!important } html,body,#root,.clinical-report { height:auto!important; overflow:visible!important; background:white!important } .clinical-report section { break-inside:avoid } }'
        }
      </style>
      <header className="print-hidden safe-area-top flex items-center justify-between border-b bg-white p-4">
        <h1 className="text-xl font-black text-cameroon-green">{t.analysis_title}</h1>
        <button onClick={() => navigate('/patients')} className="rounded border p-2">
          {tr('Records', 'Dossiers')}
        </button>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 p-4 pb-12">
        <p className="rounded border border-amber-300 bg-amber-50 p-4 text-sm">
          {clinicalLanguageNotice(language)}
        </p>
        {loading && (
          <p role="status">{tr('Checking saved report…', 'Vérification du rapport enregistré…')}</p>
        )}
        {error && (
          <p role="alert" className="rounded bg-red-50 p-3 text-red-900">
            {error}
          </p>
        )}
        {!loading && !report && (
          <p>
            {tr(
              'No authoritative saved analysis is selected. Open an encounter from records.',
              'Aucune analyse enregistrée n’est sélectionnée. Ouvrez une consultation depuis les dossiers.'
            )}
          </p>
        )}
        {report && detail && (
          <>
            <section className="rounded-xl border bg-white p-4 space-y-2">
              <h2 className="text-xl font-black">
                CamDiag · {tr('Document review report', 'Rapport de revue de document')}
              </h2>
              <p>
                {tr('Patient reference', 'Référence patient')}: {detail.encounter.patientId}
              </p>
              <p className="break-all text-xs">
                {tr('Encounter', 'Consultation')}: {detail.encounter.id} ·{' '}
                {tr('Analysis', 'Analyse')}: {saved.id}
              </p>
              <p role="status" className="font-black text-cameroon-green">
                {tr('Saved on server', 'Enregistré sur le serveur')} ·{' '}
                {review
                  ? `${tr('Clinician review', 'Revue clinique')}: ${review.disposition}`
                  : tr(
                      'UNREVIEWED — clinician review required',
                      'NON REVU — revue clinique requise'
                    )}
              </p>
              {review && (
                <p className="text-xs">
                  {tr('Reviewer', 'Réviseur')}: {review.reviewerUid} · {review.reviewedAt}
                </p>
              )}
              {review?.notes && <p className="whitespace-pre-wrap">{review.notes}</p>}
              <p>
                {tr('Referral status', 'Statut d’orientation')}: {detail.encounter.referralStatus}
              </p>
            </section>
            <section
              className={`rounded-xl border p-4 ${report.urgency === 'emergency' ? 'border-red-500 bg-red-50' : 'bg-amber-50 border-amber-300'}`}
            >
              <h2 className="font-black">
                {tr('Review urgency', 'Urgence de revue')}: {report.urgency.replace('_', ' ')}
              </h2>
              <p className="text-sm">
                {tr(
                  'An AI urgency label is not triage clearance. Escalate emergency symptoms through your clinical pathway.',
                  'Une indication d’urgence IA ne remplace pas le triage. Orientez tout signe d’urgence selon votre procédure clinique.'
                )}
              </p>
            </section>
            <section className="rounded-xl border bg-white p-4">
              <h2 className="font-black">
                {tr('Recorded patient context', 'Contexte patient enregistré')}
              </h2>
              <dl className="mt-2 space-y-1 text-sm">
                <div>
                  <dt className="inline font-bold">{tr('Age', 'Âge')}: </dt>
                  <dd className="inline">
                    {detail.encounter.patientContext.ageRange || tr('Unknown', 'Inconnu')}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-bold">{tr('Allergies', 'Allergies')}: </dt>
                  <dd className="inline">
                    {detail.encounter.patientContext.allergies?.join(', ') ||
                      tr('Not supplied', 'Non renseignées')}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-bold">{tr('Medicines', 'Médicaments')}: </dt>
                  <dd className="inline">
                    {detail.encounter.patientContext.currentMedications?.join(', ') ||
                      tr('Not supplied', 'Non renseignés')}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="space-y-3">
              <h2 className="font-black">{t.possible_findings}</h2>
              <p className="text-xs">{t.ai_confidence_not_clinical}</p>
              {report.possibleFindings.length === 0 && (
                <p>
                  {tr(
                    'No possible finding returned. This does not establish a normal result.',
                    'Aucune hypothèse retournée. Cela n’établit pas un résultat normal.'
                  )}
                </p>
              )}
              {report.possibleFindings.map((finding, i) => (
                <article key={i} className="rounded-xl border bg-white p-4 space-y-3">
                  <h3 className="text-lg font-bold text-cameroon-green">
                    {finding.name} · {finding.likelihood}
                  </h3>
                  <p>{finding.reasoning}</p>
                  <h4 className="text-sm font-bold">
                    {tr(
                      'Evidence stated by the model — verify against sources',
                      'Éléments cités par le modèle — vérifier les sources'
                    )}
                  </h4>
                  <ul className="list-disc pl-5 text-sm">
                    {finding.observedEvidence.map((e, j) => (
                      <li key={j}>{e}</li>
                    ))}
                  </ul>
                  <h4 className="text-sm font-bold">
                    {tr('Next steps for clinician review', 'Suites à examiner par le clinicien')}
                  </h4>
                  <ol className="list-decimal pl-5 text-sm">
                    {finding.recommendedNextSteps.map((step, j) => (
                      <li key={j}>{step}</li>
                    ))}
                  </ol>
                </article>
              ))}
            </section>
            <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <h2 className="font-black">
                {tr('Medication safety: not assessed', 'Sécurité médicamenteuse : non évaluée')}
              </h2>
              <p className="text-sm">
                {tr(
                  'Document interpretation does not establish medication safety. Review the patient’s selected medicines and cited evidence with a clinician or pharmacist. Do not start, stop or change treatment based on AI output.',
                  'L’interprétation du document n’établit pas la sécurité médicamenteuse. Examinez les médicaments du patient et les sources avec un clinicien ou pharmacien. Ne modifiez pas le traitement sur la base de l’IA.'
                )}
              </p>
              <button className="print-hidden mt-2 underline" onClick={() => navigate('/drugs')}>
                {tr('Review patient medicines', 'Examiner les médicaments du patient')}
              </button>
            </section>
            <section className="rounded-xl border bg-white p-4">
              <h2 className="font-black">{t.clinical_markers}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {report.markers.map((m) => (
                  <div key={m.id} className="rounded border p-3">
                    <p className="font-bold">{m.label}</p>
                    <p>
                      {m.value} · {m.status}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-xl border bg-white p-4">
              <h2 className="font-black">
                {tr('Limitations and provenance', 'Limites et provenance')}
              </h2>
              <ul className="list-disc pl-5 text-sm">
                {report.limitations.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm">{report.disclaimer}</p>
              <dl className="mt-3 break-all text-xs space-y-1">
                <div>
                  Model: {report.provenance.model} · {report.provenance.modelVersion}
                </div>
                <div>
                  Prompt: {report.provenance.promptVersion} · Schema:{' '}
                  {report.provenance.schemaVersion}
                </div>
                <div>{report.provenance.analyzedAt}</div>
                <div>
                  Document: {report.provenance.documentId} · Transcription:{' '}
                  {report.provenance.transcriptionId}
                </div>
                {report.provenance.sourceHashes.map((hash, i) => (
                  <div key={i}>
                    SHA-256 {i + 1}: {hash}
                  </div>
                ))}
              </dl>
            </section>
            <section className="print-hidden rounded-xl border bg-white p-4 space-y-3">
              <h2 className="font-black">{tr('Clinician sign-off', 'Validation du clinicien')}</h2>
              <label className="block">
                {tr('Review disposition', 'Décision de revue')}
                <select
                  className="ml-3 rounded border p-2"
                  value={disposition}
                  onChange={(e) => setDisposition(e.target.value as ReviewInput['disposition'])}
                >
                  <option value="accepted">
                    {tr('Accepted for clinical record', 'Accepté dans le dossier')}
                  </option>
                  <option value="corrected">
                    {tr('Corrected in review notes', 'Corrigé dans les notes')}
                  </option>
                  <option value="rejected">{tr('Rejected', 'Rejeté')}</option>
                </select>
              </label>
              <label className="block">
                {tr('Review notes / corrections', 'Notes / corrections')}
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={4000}
                  className="mt-1 w-full rounded border p-3"
                />
              </label>
              <label className="flex gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={attested}
                  onChange={(e) => setAttested(e.target.checked)}
                />
                {tr(
                  'I reviewed the source, patient context, limitations and proposed findings. My review does not certify the AI as a diagnosis.',
                  'J’ai examiné les sources, le contexte patient, les limites et les hypothèses. Ma revue ne certifie pas l’IA comme diagnostic.'
                )}
              </label>
              <button
                type="button"
                disabled={
                  !attested ||
                  busy ||
                  !user?.canUseClinicalTools ||
                  (disposition !== 'accepted' && !notes.trim())
                }
                onClick={() => void sign()}
                className="rounded bg-cameroon-green p-3 font-bold text-white disabled:opacity-40"
              >
                {busy
                  ? tr('Saving review…', 'Enregistrement…')
                  : tr('Save attributed review', 'Enregistrer la revue attribuée')}
              </button>
            </section>
            <div className="print-hidden flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded bg-slate-900 p-3 font-bold text-white"
              >
                {tr('Print / Save PDF', 'Imprimer / Enregistrer en PDF')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/next-steps')}
                className="rounded border p-3"
              >
                {tr('Referral and follow-up', 'Orientation et suivi')}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
export default AnalysisResults;
