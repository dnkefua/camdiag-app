// Temporary seed script — run with: node seed.cjs
// Deletes itself after running successfully.
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';

const serviceAccount = JSON.parse(await readFile(new URL('firebase-service-account.json', import.meta.url), 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const drugs = [
  { name: 'Coartem (Artemether/Lumefantrine)', type: 'Antimalarial', dosage: '20mg/120mg', availability: 'High', description: 'First-line treatment for uncomplicated malaria in Cameroon.' },
  { name: 'Paracetamol (Efferalgan)', type: 'Analgesic', dosage: '500mg/1g', availability: 'High', description: 'Used for fever and pain relief.' },
  { name: 'Fansidar (Sulfadoxine/Pyrimethamine)', type: 'Antimalarial', dosage: '500mg/25mg', availability: 'Medium', description: 'Used for intermittent preventive treatment in pregnancy.' },
  { name: 'Amoxicillin', type: 'Antibiotic', dosage: '250mg/500mg', availability: 'High', description: 'Broad-spectrum antibiotic for bacterial infections.' },
  { name: 'Quinine Sulfate', type: 'Antimalarial', dosage: '300mg', availability: 'Medium', description: 'Used for severe malaria cases.' },
  { name: 'Ciprofloxacine', type: 'Antibiotic', dosage: '500mg', availability: 'High', description: 'Used for various bacterial infections.' },
  { name: 'Artemisia Annua (Herbal)', type: 'Natural', dosage: 'Tea/Leaves', availability: 'High', description: 'Traditional medicinal plant used locally for malaria support.' },
];

const facilities = [
  { name: 'City General Dermatology', type: 'clinic', distance: '1.2 km', rating: 4.8 },
  { name: 'Hope Skin & Laser Center', type: 'clinic', distance: '2.5 km', rating: 4.5 },
  { name: 'Yaoundé Central Hospital', type: 'hospital', distance: '4.5 km', rating: 4.2 },
  { name: 'General Hospital Annex', type: 'hospital', distance: '5.8 km', rating: 4.0 },
  { name: 'MedPlus Pharmacy', type: 'pharmacy', distance: '0.8 km', rating: 4.7 },
  { name: 'Green Cross Pharma', type: 'pharmacy', distance: '1.5 km', rating: 4.6 },
  { name: 'Waspito Virtual Care', type: 'telehealth', distance: 'Online', rating: 4.9 },
  { name: 'TeleMed Direct', type: 'telehealth', distance: 'Online', rating: 4.4 },
];

console.log('Seeding drugs...');
for (const drug of drugs) {
  const snap = await db.collection('drugs').where('name', '==', drug.name).limit(1).get();
  if (snap.empty) {
    await db.collection('drugs').add({ ...drug, createdAt: new Date() });
    console.log(`  + ${drug.name}`);
  } else {
    console.log(`  ~ ${drug.name} (exists)`);
  }
}

console.log('\nSeeding facilities...');
for (const facility of facilities) {
  const snap = await db.collection('facilities').where('name', '==', facility.name).limit(1).get();
  if (snap.empty) {
    await db.collection('facilities').add({ ...facility, createdAt: new Date() });
    console.log(`  + ${facility.name}`);
  } else {
    console.log(`  ~ ${facility.name} (exists)`);
  }
}

console.log('\nDone! Drugs and facilities seeded.');
process.exit(0);
