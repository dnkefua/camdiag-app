import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('model-config', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns medgemma-4b-it by default', async () => {
    const { getActiveModel } = await import('../services/model-config');
    expect(getActiveModel()).toBe('medgemma-4b-it');
  });

  it('does not allow client-side model overrides', async () => {
    vi.stubEnv('VITE_GOOGLE_AI_MODEL', 'gemini-2.0-flash');
    const { getActiveModel } = await import('../services/model-config');
    expect(getActiveModel()).toBe('medgemma-4b-it');
  });

  it('getModelInfo identifies medgemma models', async () => {
    const { getModelInfo } = await import('../services/model-config');
    const info = getModelInfo();
    expect(info.isMedgemma).toBe(true);
    expect(info.source).toBe('backend-default');
  });

  it('getModelInfo includes defaultModel', async () => {
    const { getModelInfo } = await import('../services/model-config');
    const info = getModelInfo();
    expect(info.defaultModel).toBe('medgemma-4b-it');
  });
});
