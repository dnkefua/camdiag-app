import { create } from 'zustand';
import type { PossibleFinding, ClinicalMarker, PatientRecord, Drug, DocumentTranscription, DocumentPageInput, AnalyzeDocumentType, AnalysisUrgency, Contraindication, AnalysisProvenance, MedGemmaAnalysisResponse } from '../types';
import type { Encounter, ClinicalJob } from '../../functions/src/contracts/clinical';

// Patient data is memory-only. Durable, authorized recovery comes from the server.
export const clearLegacyClinicalStorage = (): void => {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.removeItem('camdiag_active_analysis_v1'); } catch { /* Restricted storage. */ }
  try { window.localStorage.removeItem('camdiag_active_analysis_v1'); } catch { /* Restricted storage. */ }
};

const emptyAnalysis = () => ({
  selectedFinding: 0, isAnalyzing: false, analysisError: null as string | null,
  analysisUrgency: 'unknown' as AnalysisUrgency, contraindications: [] as Contraindication[],
  analysisLimitations: [] as string[], analysisDisclaimer: '',
  analysisProvenance: undefined as AnalysisProvenance | undefined,
  possibleFindings: [] as PossibleFinding[], markers: [] as ClinicalMarker[],
});
const emptySensitiveState = () => ({
  ...emptyAnalysis(), scanCount: 0, transcription: null as DocumentTranscription | null,
  pendingPages: [] as DocumentPageInput[], pendingDocumentType: 'medical_document' as AnalyzeDocumentType,
  patientRecords: [] as PatientRecord[], drugDatabase: [] as Drug[],
  activeEncounter: null as Encounter | null, activeJob: null as ClinicalJob | null,
});

interface AppState extends ReturnType<typeof emptySensitiveState> {
  setSelectedFinding: (idx: number) => void;
  setScanCount: (count: number) => void;
  incrementScanCount: () => void;
  resetScanCount: () => void;
  setPossibleFindings: (findings: PossibleFinding[]) => void;
  setMarkers: (markers: ClinicalMarker[]) => void;
  setAnalysisResult: (result: MedGemmaAnalysisResponse) => void;
  resetAnalysis: () => void;
  resetSensitive: () => void;
  setTranscription: (value: DocumentTranscription | null) => void;
  setPendingPages: (value: DocumentPageInput[]) => void;
  setPendingDocumentType: (value: AnalyzeDocumentType) => void;
  setPatientRecords: (value: PatientRecord[]) => void;
  addPatientRecord: (value: PatientRecord) => void;
  setDrugDatabase: (value: Drug[]) => void;
  setAnalyzing: (value: boolean) => void;
  setAnalysisError: (value: string | null) => void;
  setActiveEncounter: (value: Encounter | null) => void;
  setActiveJob: (value: ClinicalJob | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  ...emptySensitiveState(),
  setSelectedFinding: (selectedFinding) => set({ selectedFinding }),
  setScanCount: (scanCount) => set({ scanCount }),
  incrementScanCount: () => set((s) => ({ scanCount: s.scanCount + 1 })),
  resetScanCount: () => set({ scanCount: 0 }),
  setPossibleFindings: (possibleFindings) => set({ possibleFindings }),
  setMarkers: (markers) => set({ markers }),
  setAnalysisResult: (result) => {
    clearLegacyClinicalStorage();
    set({ possibleFindings: result.possibleFindings, markers: result.markers,
      analysisUrgency: result.urgency, contraindications: result.contraindications,
      analysisLimitations: result.limitations, analysisDisclaimer: result.disclaimer,
      analysisProvenance: result.provenance, analysisError: null, selectedFinding: 0 });
  },
  resetAnalysis: () => { clearLegacyClinicalStorage(); set(emptyAnalysis()); },
  resetSensitive: () => { clearLegacyClinicalStorage(); set(emptySensitiveState()); },
  setTranscription: (transcription) => set({ transcription }),
  setPendingPages: (pendingPages) => set({ pendingPages }),
  setPendingDocumentType: (pendingDocumentType) => set({ pendingDocumentType }),
  setPatientRecords: (patientRecords) => set({ patientRecords }),
  addPatientRecord: (record) => set((s) => ({ patientRecords: [record, ...s.patientRecords] })),
  setDrugDatabase: (drugDatabase) => set({ drugDatabase }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisError: (analysisError) => set({ analysisError }),
  setActiveEncounter: (activeEncounter) => set({ activeEncounter }),
  setActiveJob: (activeJob) => set({ activeJob }),
}));
