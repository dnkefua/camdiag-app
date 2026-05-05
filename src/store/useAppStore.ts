import { create } from 'zustand';
import type { PossibleFinding, ClinicalMarker, PatientRecord, Drug } from '../types';

interface AppState {
  selectedFinding: number;
  scanCount: number;
  isAnalyzing: boolean;
  analysisError: string | null;
  possibleFindings: PossibleFinding[];
  markers: ClinicalMarker[];
  patientRecords: PatientRecord[];
  drugDatabase: Drug[];
  setSelectedFinding: (idx: number) => void;
  setScanCount: (count: number) => void;
  incrementScanCount: () => void;
  resetScanCount: () => void;
  setPossibleFindings: (possibleFindings: PossibleFinding[]) => void;
  setMarkers: (markers: ClinicalMarker[]) => void;
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
  possibleFindings: [],
  markers: [],
  patientRecords: [],
  drugDatabase: [],
  setSelectedFinding: (idx) => set({ selectedFinding: idx }),
  setScanCount: (count) => set({ scanCount: count }),
  incrementScanCount: () => set((s) => ({ scanCount: s.scanCount + 1 })),
  resetScanCount: () => set({ scanCount: 0 }),
  setPossibleFindings: (possibleFindings) => set({ possibleFindings }),
  setMarkers: (markers) => set({ markers }),
  setPatientRecords: (records) => set({ patientRecords: records }),
  addPatientRecord: (record) => set((s) => ({ patientRecords: [record, ...s.patientRecords] })),
  setDrugDatabase: (drugs) => set({ drugDatabase: drugs }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisError: (error) => set({ analysisError: error }),
}));
