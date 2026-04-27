import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('model-config', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns gemini-2.0-flash by default', async () => {
    vi.stubEnv('VITE_GOOGLE_AI_MODEL', '');
    vi.stubEnv('VITE_USE_MEDGEMMA', '');
    const { getActiveModel } = await import('../services/model-config');
    expect(getActiveModel()).toBe('gemini-2.0-flash');
  });

  it('returns env-var model when set', async () => {
    vi.stubEnv('VITE_GOOGLE_AI_MODEL', 'medgemma-27b');
    const { getActiveModel } = await import('../services/model-config');
    expect(getActiveModel()).toBe('medgemma-27b');
  });

  it('getModelInfo identifies medgemma models', async () => {
    vi.stubEnv('VITE_GOOGLE_AI_MODEL', 'medgemma-27b');
    const { getModelInfo } = await import('../services/model-config');
    const info = getModelInfo();
    expect(info.isMedgemma).toBe(true);
    expect(info.source).toBe('env');
  });

  it('getModelInfo identifies non-medgemma models', async () => {
    vi.stubEnv('VITE_GOOGLE_AI_MODEL', '');
    vi.stubEnv('VITE_USE_MEDGEMMA', '');
    const { getModelInfo } = await import('../services/model-config');
    const info = getModelInfo();
    expect(info.isMedgemma).toBe(false);
    expect(info.source).toBe('default');
  });
});