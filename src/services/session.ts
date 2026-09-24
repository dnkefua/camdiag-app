import { useAppStore } from '../store/useAppStore';

let sessionController = new AbortController();
let currentUid: string | null = null;
export const getSensitiveSessionSignal = (): AbortSignal => sessionController.signal;

/** Abort in-flight work before dropping patient data. */
export const resetSensitiveSession = (): void => {
  sessionController.abort();
  sessionController = new AbortController();
  useAppStore.getState().resetSensitive();
};
export const bindSensitiveSession = (uid: string | null): void => {
  if (uid !== currentUid || uid === null) resetSensitiveSession();
  currentUid = uid;
};
