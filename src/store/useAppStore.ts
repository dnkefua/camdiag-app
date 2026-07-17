import { create } from 'zustand';
import type {
  PossibleFinding,
  ClinicalMarker,
  PatientRecord,
  Drug,
  DocumentTranscription,
  DocumentPageInput,
  AnalyzeDocumentType,
  AnalysisUrgency,
  Contraindication,
  AnalysisProvenance,
  MedGemmaAnalysisResponse,
} from '../types';

interface AppState {
  selectedFinding: number;
  scanCount: number;
  isAnalyzing: boolean;
  analysisError: string | null;
  analysisUrgency: AnalysisUrgency;
  contraindications: Contraindication[];
  analysisLimitations: string[];
  analysisDisclaimer: string;
  analysisProvenance?: AnalysisProvenance;
  possibleFindings: PossibleFinding[];
  markers: ClinicalMarker[];
  transcription: DocumentTranscription | null;
  pendingPages: DocumentPageInput[];
  pendingDocumentType: AnalyzeDocumentType;
  patientRecords: PatientRecord[];
  drugDatabase: Drug[];
  setSelectedFinding: (idx: number) => void;
  setScanCount: (count: number) => void;
  incrementScanCount: () => void;
  resetScanCount: () => void;
  setPossibleFindings: (possibleFindings: PossibleFinding[]) => void;
  setMarkers: (markers: ClinicalMarker[]) => void;
  setAnalysisResult: (result: MedGemmaAnalysisResponse) => void;
  resetAnalysis: () => void;
  setTranscription: (transcription: DocumentTranscription | null) => void;
  setPendingPages: (pages: DocumentPageInput[]) => void;
  setPendingDocumentType: (documentType: AnalyzeDocumentType) => void;
  setPatientRecords: (records: PatientRecord[]) => void;
  addPatientRecord: (record: PatientRecord) => void;
  setDrugDatabase: (drugs: Drug[]) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setAnalysisError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedFinding: 0,
  scanCount: 0,
  isAnalyzing: false,
  analysisError: null,
  analysisUrgency: 'unknown',
  contraindications: [],
  analysisLimitations: [],
  analysisDisclaimer: '',
  analysisProvenance: undefined,
  possibleFindings: [],
  markers: [],
  transcription: null,
  pendingPages: [],
  pendingDocumentType: 'medical_document',
  patientRecords: [],
  drugDatabase: [],
  setSelectedFinding: (idx) => set({ selectedFinding: idx }),
  setScanCount: (count) => set({ scanCount: count }),
  incrementScanCount: () => set((s) => ({ scanCount: s.scanCount + 1 })),
  resetScanCount: () => set({ scanCount: 0 }),
  setPossibleFindings: (possibleFindings) => set({ possibleFindings }),
  setMarkers: (markers) => set({ markers }),
  setAnalysisResult: (result) => set({
    possibleFindings: result.possibleFindings,
    markers: result.markers,
    analysisUrgency: result.urgency,
    contraindications: result.contraindications,
    analysisLimitations: result.limitations,
    analysisDisclaimer: result.disclaimer,
    analysisProvenance: result.provenance,
    analysisError: null,
    selectedFinding: 0,
  }),
  resetAnalysis: () => set({
    possibleFindings: [],
    markers: [],
    analysisUrgency: 'unknown',
    contraindications: [],
    analysisLimitations: [],
    analysisDisclaimer: '',
    analysisProvenance: undefined,
    analysisError: null,
    selectedFinding: 0,
  }),
  setTranscription: (transcription) => set({ transcription }),
  setPendingPages: (pendingPages) => set({ pendingPages }),
  setPendingDocumentType: (pendingDocumentType) => set({ pendingDocumentType }),
  setPatientRecords: (records) => set({ patientRecords: records }),
  addPatientRecord: (record) => set((s) => ({ patientRecords: [record, ...s.patientRecords] })),
  setDrugDatabase: (drugs) => set({ drugDatabase: drugs }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisError: (error) => set({ analysisError: error }),
}));
