/**
 * Model configuration for Google AI.
 *
 * When MedGemma becomes available as a dedicated model ID,
 * set VITE_GOOGLE_AI_MODEL to that ID (e.g. "medgemma" or "medgemma-27b").
 *
 * Feature flag: Set VITE_USE_MEDGEMMA=true to auto-select MedGemma
 * when it becomes available. Falls back to gemini-2.0-flash if the
 * MedGemma model ID is not yet released.
 */

const getActiveModel = (): string => {
  const envModel = import.meta.env.VITE_GOOGLE_AI_MODEL;
  if (envModel) return envModel;

  const useMedgemma = import.meta.env.VITE_USE_MEDGEMMA === 'true';
  if (useMedgemma) {
    console.warn(
      'VITE_USE_MEDGEMMA=true but MedGemma model ID not yet released. Falling back to gemini-2.0-flash.'
    );
  }

  return 'gemini-2.0-flash';
};

export const getModelInfo = () => ({
  modelId: getActiveModel(),
  isMedgemma: getActiveModel().startsWith('medgemma'),
  source: import.meta.env.VITE_GOOGLE_AI_MODEL ? 'env' : 'default',
});

export { getActiveModel };