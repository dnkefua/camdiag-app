import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { checkDrugInteractions, searchMedicationInfo } from '../services/medgemma';
import { clinicalLanguageNotice, clinicalText } from '../utils/clinicalLanguage';
import { getSensitiveSessionSignal } from '../services/session';
import type { MedicationAssessment } from '../../functions/src/contracts/clinical';

const MAX_MEDICATIONS = 10;

const DrugDatabase = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { user } = useAuth();
  const { activeEncounter } = useAppStore();
  const sourceListTooLarge = (activeEncounter?.patientContext.currentMedications?.length ?? 0) > MAX_MEDICATIONS;
  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState<string[]>(
    activeEncounter?.patientContext.currentMedications ?? []
  );
  const [assessment, setAssessment] = useState<MedicationAssessment | null>(null);
  const [searchResult, setSearchResult] = useState<MedicationAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verifiedList, setVerifiedList] = useState(false);
  const request = useRef<AbortController | null>(null);
  const version = useRef(0);
  const tr = (en: string, fr: string) => clinicalText(language, en, fr);
  useEffect(() => {
    version.current++;
    request.current?.abort();
    request.current = new AbortController();
    const controller = request.current;
    const session = getSensitiveSessionSignal();
    const clear = () => {
      version.current++;
      request.current?.abort();
      setMedicines([]);
      setAssessment(null);
      setSearchResult(null);
      setQuery('');
      setBusy(false);
      setVerifiedList(false);
    };
    session.addEventListener('abort', clear, { once: true });
    setMedicines(activeEncounter?.patientContext.currentMedications ?? []);
    setAssessment(null);
    setSearchResult(null);
    setError(null);
    setQuery('');
    setVerifiedList(false);
    setBusy(false);
    return () => {
      controller.abort();
      session.removeEventListener('abort', clear);
    };
  }, [user?.uid, activeEncounter?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const add = () => {
    const value = query.trim();
    if (
      !value ||
      medicines.some((m) => m.toLowerCase() === value.toLowerCase()) ||
      medicines.length >= MAX_MEDICATIONS
    )
      return;
    setMedicines((old) => [...old, value]);
    setQuery('');
    setAssessment(null);
    setVerifiedList(false);
  };
  const run = async (kind: 'search' | 'interactions') => {
    if (busy || !user?.canUseClinicalTools || !request.current) return;
    if (kind === 'interactions' && (!activeEncounter || !verifiedList || sourceListTooLarge || medicines.length < 2 || medicines.length > MAX_MEDICATIONS))
      return;
    const signal = request.current.signal;
    const generation = version.current;
    setBusy(true);
    setError(null);
    if (kind === 'interactions') setAssessment(null);
    else setSearchResult(null);
    try {
      const result =
        kind === 'interactions'
          ? await checkDrugInteractions(medicines, language, activeEncounter!.id, signal)
          : await searchMedicationInfo(query.trim(), language, signal);
      if (signal.aborted || generation !== version.current) return;
      if (kind === 'interactions') setAssessment(result);
      else setSearchResult(result);
    } catch (e) {
      if (!signal.aborted && generation === version.current)
        setError(e instanceof Error ? e.message : 'Medication safety is not assessed.');
    } finally {
      if (!signal.aborted && generation === version.current) setBusy(false);
    }
  };
  const evidence = (result: MedicationAssessment) => (
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3">
      <h2 className="font-black">
        {result.status === 'not_assessed'
          ? tr(
              'Not assessed — insufficient reviewed evidence',
              'Non évalué — données revues insuffisantes'
            )
          : tr(
              'Reviewed evidence available — clinical interpretation required',
              'Données revues disponibles — interprétation clinique requise'
            )}
      </h2>
      <p className="whitespace-pre-wrap text-sm">{result.result}</p>
      {result.evidence.map((e) => (
        <article key={e.id} className="rounded border bg-white p-3 text-sm">
          <p>{e.text}</p>
          <p className="mt-2 font-bold">{e.citation}</p>
          <p className="text-xs">
            Version: {e.version} · {tr('Reviewed', 'Revu')}: {e.reviewedAt} · ID: {e.id}
          </p>
        </article>
      ))}
    </section>
  );
  return (
    <div className="screen-safe overflow-y-auto bg-slate-50 text-slate-900">
      <header className="safe-area-top flex justify-between gap-3 border-b bg-white p-4">
        <h1 className="text-xl font-black text-cameroon-green">
          {tr('Patient medication review', 'Revue des médicaments du patient')}
        </h1>
        <button onClick={() => navigate('/app')} className="rounded border p-2">
          {tr('Home', 'Accueil')}
        </button>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 p-4 pb-12">
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          {clinicalLanguageNotice(language)}
        </p>
        <p className="text-sm">
          {tr(
            'Absence of an interaction warning does not establish safety. Allergy, dose, pregnancy and organ-function suitability require clinical assessment. Remedy evidence may be incomplete.',
            'L’absence d’alerte n’établit pas la sécurité. Allergies, doses, grossesse et fonctions organiques nécessitent une évaluation clinique. Les données sur les remèdes peuvent être incomplètes.'
          )}
        </p>
        {activeEncounter ? (
          <section className="rounded-xl border bg-white p-4">
            <h2 className="font-black">
              {activeEncounter.patientId} · {activeEncounter.id}
            </h2>
            <p className="text-sm">
              {tr('Allergies', 'Allergies')}:{' '}
              {activeEncounter.patientContext.allergies?.join(', ') ||
                tr('Not supplied', 'Non renseignées')}
            </p>
            <p className="text-sm">
              {tr('Pregnancy', 'Grossesse')}:{' '}
              {activeEncounter.patientContext.pregnancyStatus ?? 'unknown'} · {tr('Age', 'Âge')}:{' '}
              {activeEncounter.patientContext.ageRange ?? tr('Unknown', 'Inconnu')}
            </p>
          </section>
        ) : (
          <p className="rounded bg-amber-50 p-3">
            {tr(
              'Select a patient encounter before checking interactions.',
              'Sélectionnez une consultation avant de vérifier les interactions.'
            )}{' '}
            <button className="underline" onClick={() => navigate('/patients')}>
              {tr('Open records', 'Ouvrir les dossiers')}
            </button>
          </p>
        )}
        <label className="block font-bold">
          {tr('Medication / active ingredient', 'Médicament / substance active')}
          <input
            aria-label="Medication / active ingredient"
            disabled={busy}
            value={query}
            maxLength={120}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-2 w-full rounded border p-3"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={busy || !query.trim() || !activeEncounter || medicines.length >= MAX_MEDICATIONS}
            onClick={add}
            className="rounded bg-cameroon-green p-3 font-bold text-white disabled:opacity-40"
          >
            {tr('Add to selected patient list', 'Ajouter à la liste du patient')}
          </button>
          <button
            disabled={busy || !query.trim()}
            onClick={() => void run('search')}
            className="rounded border p-3 disabled:opacity-40"
          >
            {tr('Find reviewed reference', 'Chercher une référence revue')}
          </button>
        </div>
        <section className="rounded-xl border bg-white p-4 space-y-3">
          <h2 className="font-black">
            {tr('Selected medicines', 'Médicaments sélectionnés')} ({medicines.length}/{MAX_MEDICATIONS})
          </h2>
          <p className="text-xs">
            {tr(
              'This explicit list is independent of search results. Confirm generic ingredients and spelling; combination products must be reviewed for all ingredients. Changes here do not rewrite the original encounter context.',
              'Cette liste est indépendante des recherches. Confirmez les substances et leur orthographe ; vérifiez tous les composants des associations. Les modifications ne réécrivent pas le contexte initial.'
            )}
          </p>
          <ul>
            {medicines.map((m) => (
              <li key={m} className="flex items-center justify-between gap-3 border-b py-2">
                <span>{m}</span>
                <button
                  disabled={busy}
                  aria-label={`Remove ${m}`}
                  onClick={() => {
                    setMedicines((old) => old.filter((v) => v !== m));
                    setAssessment(null);
                    setVerifiedList(false);
                  }}
                  className="text-sm underline"
                >
                  {tr('Remove', 'Retirer')}
                </button>
              </li>
            ))}
          </ul>
          {sourceListTooLarge && (
            <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
              {tr(
                'More than 10 medicines need a pharmacist-led full-list review. A smaller subset could miss interactions, so this checker will not assess a partial list.',
                'Plus de 10 médicaments exigent une revue de la liste complète par un pharmacien. Un sous-ensemble pourrait manquer des interactions ; cet outil ne l’évaluera pas.'
              )}
            </p>
          )}
          <label className="flex gap-3 text-sm">
            <input
              type="checkbox"
              checked={verifiedList}
              disabled={busy || sourceListTooLarge || medicines.length < 2 || medicines.length > MAX_MEDICATIONS}
              onChange={(e) => setVerifiedList(e.target.checked)}
            />
            {tr(
              'I confirmed this patient’s intended medicine list and active ingredients. Missing context remains unknown.',
              'J’ai confirmé la liste de ce patient et les substances actives. Les informations manquantes restent inconnues.'
            )}
          </label>
          <button
            disabled={busy || !activeEncounter || !verifiedList || sourceListTooLarge || medicines.length < 2 || medicines.length > MAX_MEDICATIONS}
            onClick={() => void run('interactions')}
            className="w-full rounded bg-cameroon-green p-3 font-bold text-white disabled:opacity-40"
          >
            {tr('Review selected interactions', 'Examiner les interactions sélectionnées')}
          </button>
        </section>
        {busy && (
          <p role="status">{tr('Retrieving reviewed evidence…', 'Recherche de données revues…')}</p>
        )}
        {error && (
          <p role="alert" className="rounded bg-red-50 p-3 text-red-900">
            {error}
          </p>
        )}
        {assessment && evidence(assessment)}
        {searchResult && evidence(searchResult)}
      </main>
    </div>
  );
};
export default DrugDatabase;
