import { collection, doc, getDocs, setDoc, query, orderBy, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getSensitiveSessionSignal } from './session';

// Clinical records, sources, results and reviews are owned by the backend API.
// This browser module deliberately exposes no clinical writes or database seeder.
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
  try {
    const posts = collection(db, 'blog');
    const filter = category
      ? query(posts, where('category', '==', category), orderBy('createdAt', 'desc'))
      : query(posts, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(filter);
    return snapshot.docs.map((document) => {
      const data = document.data() as Record<string, unknown>;
      const text = (key: string) => typeof data[key] === 'string' ? data[key] as string : '';
      return { id: document.id, category: text('category'), title: text('title'), excerpt: text('excerpt'), date: text('date'), readTime: text('readTime'), createdAt: data.createdAt };
    });
  } catch {
    throw new Error('Failed to load posts. Please check your connection and try again.');
  }
};

export interface UserProfileUpdate {
  name?: string;
  photoUrl?: string;
  about?: string;
  notificationPrefs?: { scanResults: boolean; medicationAlerts: boolean; productUpdates: boolean };
}

/** Defense in depth: editable profile data cannot carry clinical authority or patient context. */
export const updateUserProfile = async (uid: string, data: UserProfileUpdate): Promise<void> => {
  const session = getSensitiveSessionSignal();
  if (!auth.currentUser || auth.currentUser.uid !== uid || session.aborted) throw new Error('Please sign in again before updating your profile.');
  const allowed = ['name', 'photoUrl', 'about', 'notificationPrefs'];
  if (!data || typeof data !== 'object' || Object.keys(data).some((key) => !allowed.includes(key))) throw new Error('Unsupported profile field.');
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.length > 120)) throw new Error('Display name must be at most 120 characters.');
  if (data.about !== undefined && (typeof data.about !== 'string' || data.about.length > 1000)) throw new Error('Profile description must be at most 1000 characters.');
  if (data.photoUrl !== undefined && (typeof data.photoUrl !== 'string' || data.photoUrl.length > 2000 || !/^https:\/\//.test(data.photoUrl))) throw new Error('Profile image must use an HTTPS URL.');
  if (data.notificationPrefs !== undefined) {
    const preferences = data.notificationPrefs;
    const keys = ['scanResults', 'medicationAlerts', 'productUpdates'] as const;
    if (!preferences || typeof preferences !== 'object' || Object.keys(preferences).length !== keys.length || keys.some((key) => typeof preferences[key] !== 'boolean')) throw new Error('Invalid notification preferences.');
  }
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
    session.throwIfAborted();
    if (auth.currentUser?.uid !== uid) throw new Error('Session changed.');
  } catch {
    throw new Error('Failed to update profile. Please sign in again or retry.');
  }
};
