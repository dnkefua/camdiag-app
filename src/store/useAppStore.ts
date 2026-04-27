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
  diagnoses: [
    {
      name: 'Malaria (P. Falciparum)',
      probability: '94%',
      markers: ['parasites', 'hematocrit'],
      drugs: ['Coartem', 'Quinine'],
      contri: ['Artemisia Tea', 'Papaya Leaves'],
      reasoning: 'High parasite count and low hematocrit suggest active malaria infection.',
    },
    {
      name: 'Bacterial Dermatitis',
      probability: '12%',
      markers: ['hematocrit'],
      drugs: ['Amoxicillin', 'Ciprofloxacine'],
      contri: ['Aloe Vera', 'Honey'],
      reasoning: 'Skin-surface inflammation matches typical bacterial patterns.',
    },
  ],
  markers: [
    { id: 'hematocrit', label: 'Hematocrit Count', value: '32%', status: 'Low', color: 'orange' },
    { id: 'parasites', label: 'Malaria Parasites', value: '2500/µL', status: 'High', color: 'red' },
  ],
  patientRecords: [
    { date: 'March 10, 2026', diagnosis: 'Dermatitis (Likely)', id: '8829', status: 'Analyzed', result: '92% Match', category: 'Camera Scan', bodyPart: 'Arm/Skin Surface' },
    { date: 'February 24, 2026', diagnosis: 'Cataract Check', id: '8814', status: 'Analyzed', result: 'Negative', category: 'Camera Scan', bodyPart: 'Left Eye' },
    { date: 'January 15, 2026', diagnosis: 'Malaria RDT Scan', id: '8792', status: 'Positive', result: 'Stage 1', category: 'Lab Document', bodyPart: 'In-Vitro Sample' },
    { date: 'December 12, 2025', diagnosis: 'Respiratory Syncytial Virus', id: '8645', status: 'Analyzed', result: 'Needs follow-up', category: 'X-Ray Scan', bodyPart: 'Chest / Lungs' },
  ],
  drugDatabase: [
    { name: 'Coartem (Artemether/Lumefantrine)', type: 'Antimalarial', dosage: '20mg/120mg', availability: 'High', description: 'First-line treatment for uncomplicated malaria in Cameroon.' },
    { name: 'Paracetamol (Efferalgan)', type: 'Analgesic', dosage: '500mg/1g', availability: 'High', description: 'Used for fever and pain relief.' },
    { name: 'Fansidar (Sulfadoxine/Pyrimethamine)', type: 'Antimalarial', dosage: '500mg/25mg', availability: 'Medium', description: 'Used for intermittent preventive treatment in pregnancy.' },
    { name: 'Amoxicillin', type: 'Antibiotic', dosage: '250mg/500mg', availability: 'High', description: 'Broad-spectrum antibiotic for bacterial infections.' },
    { name: 'Quinine Sulfate', type: 'Antimalarial', dosage: '300mg', availability: 'Medium', description: 'Used for severe malaria cases.' },
    { name: 'Ciprofloxacine', type: 'Antibiotic', dosage: '500mg', availability: 'High', description: 'Used for various bacterial infections.' },
    { name: 'Artemisia Annua (Herbal)', type: 'Natural', dosage: 'Tea/Leaves', availability: 'High', description: 'Traditional medicinal plant used locally for malaria support.' },
  ],
  setSelectedDiagnosis: (idx) => set({ selectedDiagnosis: idx }),
  setScanCount: (count) => set({ scanCount: count }),
  incrementScanCount: () => set((s) => ({ scanCount: s.scanCount + 1 })),
  resetScanCount: () => set({ scanCount: 0 }),
  setDiagnoses: (diagnoses) => set({ diagnoses }),
  setMarkers: (markers) => set({ markers }),
  addPatientRecord: (record) => set((s) => ({ patientRecords: [record, ...s.patientRecords] })),
  setDrugDatabase: (drugs) => set({ drugDatabase: drugs }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisError: (error) => set({ analysisError: error }),
}));