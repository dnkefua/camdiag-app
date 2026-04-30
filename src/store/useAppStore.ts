import { create } from 'zustand';
import type { Diagnosis, ClinicalMarker, PatientRecord, Drug } from '../types';

interface AppState {
  selectedDiagnosis: number;
  scanCount: number;
  isAnalyzing: boolean;
  analysisError: string | null;
  diagnoses: Diagnosis[];
  markers: ClinicalMarker[];
  patientRecords: PatientRecord[];
  drugDatabase: Drug[];
  setSelectedDiagnosis: (idx: number) => void;
  setScanCount: (count: number) => void;
  incrementScanCount: () => void;
  resetScanCount: () => void;
  setDiagnoses: (diagnoses: Diagnosis[]) => void;
  setMarkers: (markers: ClinicalMarker[]) => void;
  setPatientRecords: (records: PatientRecord[]) => void;
  addPatientRecord: (record: PatientRecord) => void;
  setDrugDatabase: (drugs: Drug[]) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setAnalysisError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedDiagnosis: 0,
  scanCount: 0,
  isAnalyzing: false,
  analysisError: null,
  diagnoses: [],
  markers: [],
  patientRecords: [],
  drugDatabase: [],
  setSelectedDiagnosis: (idx) => set({ selectedDiagnosis: idx }),
  setScanCount: (count) => set({ scanCount: count }),
  incrementScanCount: () => set((s) => ({ scanCount: s.scanCount + 1 })),
  resetScanCount: () => set({ scanCount: 0 }),
  setDiagnoses: (diagnoses) => set({ diagnoses }),
  setMarkers: (markers) => set({ markers }),
  setPatientRecords: (records) => set({ patientRecords: records }),
  addPatientRecord: (record) => set((s) => ({ patientRecords: [record, ...s.patientRecords] })),
  setDrugDatabase: (drugs) => set({ drugDatabase: drugs }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisError: (error) => set({ analysisError: error }),
}));