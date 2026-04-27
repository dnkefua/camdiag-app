import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ---- Patient Records ----
export interface FirestorePatientRecord {
  id?: string;
  userId: string;
  date: string;
  diagnosis: string;
  status: string;
  result: string;
  category: string;
  bodyPart: string;
  createdAt?: unknown;
}

export const getPatientRecords = async (userId: string): Promise<FirestorePatientRecord[]> => {
  const q = query(collection(db, 'patients'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirestorePatientRecord));
};

export const addPatientRecord = async (record: Omit<FirestorePatientRecord, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'patients'), { ...record, createdAt: serverTimestamp() });
  return docRef.id;
};

export const onPatientRecordsChange = (userId: string, callback: (records: FirestorePatientRecord[]) => void): Unsubscribe => {
  const q = query(collection(db, 'patients'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirestorePatientRecord));
    callback(records);
  });
};

// ---- Scan Results ----
export interface FirestoreScanResult {
  id?: string;
  userId: string;
  title: string;
  date: string;
  match: string;
  type: string;
  imageData?: string;
  aiResponse?: string;
  createdAt?: unknown;
}

export const getScanResults = async (userId: string): Promise<FirestoreScanResult[]> => {
  const q = query(collection(db, 'scans'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirestoreScanResult));
};

export const addScanResult = async (scan: Omit<FirestoreScanResult, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'scans'), { ...scan, createdAt: serverTimestamp() });
  return docRef.id;
};

// ---- Blog Posts ----
export interface FirestoreBlogPost {
  id?: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  createdAt?: unknown;
}

export const getBlogPosts = async (category?: string): Promise<FirestoreBlogPost[]> => {
  let q;
  if (category) {
    q = query(collection(db, 'blog'), where('category', '==', category), orderBy('createdAt', 'desc'));
  } else {
    q = query(collection(db, 'blog'), orderBy('createdAt', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirestoreBlogPost));
};

// ---- Drug Database ----
export interface FirestoreDrug {
  id?: string;
  name: string;
  type: string;
  dosage: string;
  availability: string;
  description: string;
  createdAt?: unknown;
}

export const getDrugs = async (): Promise<FirestoreDrug[]> => {
  const q = query(collection(db, 'drugs'), orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirestoreDrug));
};

// ---- Facilities ----
export interface FirestoreFacility {
  id?: string;
  name: string;
  type: 'clinic' | 'hospital' | 'pharmacy' | 'telehealth';
  distance: string;
  rating: number;
  address?: string;
  phone?: string;
  createdAt?: unknown;
}

export const getFacilities = async (type?: string): Promise<FirestoreFacility[]> => {
  let q;
  if (type) {
    q = query(collection(db, 'facilities'), where('type', '==', type), orderBy('rating', 'desc'));
  } else {
    q = query(collection(db, 'facilities'), orderBy('rating', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirestoreFacility));
};

// ---- User Profile ----
export const updateUserProfile = async (uid: string, data: Partial<{ name: string; role: string }>): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), data);
};

export const deleteUser = async (uid: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', uid));
};

// ---- Seed Data ----
export const seedDatabase = async (): Promise<void> => {
  const drugs: Omit<FirestoreDrug, 'id'>[] = [
    { name: 'Coartem (Artemether/Lumefantrine)', type: 'Antimalarial', dosage: '20mg/120mg', availability: 'High', description: 'First-line treatment for uncomplicated malaria in Cameroon.' },
    { name: 'Paracetamol (Efferalgan)', type: 'Analgesic', dosage: '500mg/1g', availability: 'High', description: 'Used for fever and pain relief.' },
    { name: 'Fansidar (Sulfadoxine/Pyrimethamine)', type: 'Antimalarial', dosage: '500mg/25mg', availability: 'Medium', description: 'Used for intermittent preventive treatment in pregnancy.' },
    { name: 'Amoxicillin', type: 'Antibiotic', dosage: '250mg/500mg', availability: 'High', description: 'Broad-spectrum antibiotic for bacterial infections.' },
    { name: 'Quinine Sulfate', type: 'Antimalarial', dosage: '300mg', availability: 'Medium', description: 'Used for severe malaria cases.' },
    { name: 'Ciprofloxacine', type: 'Antibiotic', dosage: '500mg', availability: 'High', description: 'Used for various bacterial infections.' },
    { name: 'Artemisia Annua (Herbal)', type: 'Natural', dosage: 'Tea/Leaves', availability: 'High', description: 'Traditional medicinal plant used locally for malaria support.' },
  ];

  for (const drug of drugs) {
    const existing = await getDocs(query(collection(db, 'drugs'), where('name', '==', drug.name)));
    if (existing.empty) {
      await addDoc(collection(db, 'drugs'), { ...drug, createdAt: serverTimestamp() });
    }
  }

  const facilities: Omit<FirestoreFacility, 'id'>[] = [
    { name: 'City General Dermatology', type: 'clinic', distance: '1.2 km', rating: 4.8 },
    { name: 'Hope Skin & Laser Center', type: 'clinic', distance: '2.5 km', rating: 4.5 },
    { name: 'Yaound\u00e9 Central Hospital', type: 'hospital', distance: '4.5 km', rating: 4.2 },
    { name: 'General Hospital Annex', type: 'hospital', distance: '5.8 km', rating: 4.0 },
    { name: 'MedPlus Pharmacy', type: 'pharmacy', distance: '0.8 km', rating: 4.7 },
    { name: 'Green Cross Pharma', type: 'pharmacy', distance: '1.5 km', rating: 4.6 },
    { name: 'Waspito Virtual Care', type: 'telehealth', distance: 'Online', rating: 4.9 },
    { name: 'TeleMed Direct', type: 'telehealth', distance: 'Online', rating: 4.4 },
  ];

  for (const facility of facilities) {
    const existing = await getDocs(query(collection(db, 'facilities'), where('name', '==', facility.name)));
    if (existing.empty) {
      await addDoc(collection(db, 'facilities'), { ...facility, createdAt: serverTimestamp() });
    }
  }
};