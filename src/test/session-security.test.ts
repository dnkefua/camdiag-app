import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../store/useAppStore';
import { bindSensitiveSession, getSensitiveSessionSignal, resetSensitiveSession } from '../services/session';
import { getAnalyticsConsent, setAnalyticsConsent, clearPrivacyPreferences } from '../services/privacy';
vi.mock('../lib/firebase', () => ({ getAnalyticsInstance: vi.fn(async () => null) }));
import { sanitizeAnalyticsEvent } from '../services/analytics';

beforeEach(() => { bindSensitiveSession(null); localStorage.clear(); sessionStorage.clear(); });
describe('shared-device privacy', () => {
  it('clears all sensitive data and aborts pending requests on user A to user B', () => {
    bindSensitiveSession('A');
    const previousSignal = getSensitiveSessionSignal();
    const state = useAppStore.getState();
    state.setPendingPages([{ id: 'p', fileName: 'synthetic.png', mimeType: 'image/png', contentBase64: 'synthetic' }]);
    state.setTranscription({ documentId: 'd', processorVersion: 'v', requiresReview: true, pages: [] });
    state.setPatientRecords([{ id: 'private', diagnosis: 'synthetic', date: '', status: '', result: '', category: '', bodyPart: '' }]);
    state.setAnalyzing(true);
    sessionStorage.setItem('camdiag_active_analysis_v1', 'legacy sensitive data');
    bindSensitiveSession('B');
    expect(previousSignal.aborted).toBe(true);
    expect(useAppStore.getState()).toMatchObject({ pendingPages: [], transcription: null, patientRecords: [], activeEncounter: null, activeJob: null, isAnalyzing: false });
    expect(sessionStorage.getItem('camdiag_active_analysis_v1')).toBeNull();
    // A failed fetch for B leaves an empty state, never A's cached records.
    expect(useAppStore.getState().patientRecords).toEqual([]);
  });
  it('does not reset the active encounter on an unchanged identity', () => {
    bindSensitiveSession('A');
    useAppStore.getState().setScanCount(3);
    const signal = getSensitiveSessionSignal();
    bindSensitiveSession('A');
    expect(signal.aborted).toBe(false);
    expect(useAppStore.getState().scanCount).toBe(3);
  });
  it('explicit invalidation clears and rotates the session', () => {
    const signal = getSensitiveSessionSignal();
    resetSensitiveSession();
    expect(signal.aborted).toBe(true);
    expect(getSensitiveSessionSignal().aborted).toBe(false);
  });
});
describe('optional analytics', () => {
  it('defaults off and supports withdrawal', () => {
    expect(getAnalyticsConsent()).toBe(false);
    setAnalyticsConsent(true); expect(getAnalyticsConsent()).toBe(true);
    clearPrivacyPreferences(); expect(getAnalyticsConsent()).toBe(false);
  });
  it('rejects clinical routes, error events, and free-text metadata', () => {
    expect(sanitizeAnalyticsEvent('page_view', { path: '/analysis' })).toBeNull();
    expect(sanitizeAnalyticsEvent('scan_failed', { error: 'Patient private text' })).toBeNull();
    expect(sanitizeAnalyticsEvent('demo_step', { step: 2, patient: 'Private', error: 'Private' })).toEqual({ step: 2 });
    expect(sanitizeAnalyticsEvent('page_view', { path: '/', query: 'Private' })).toEqual({ page_path: '/' });
  });
});
