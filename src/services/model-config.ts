/**
 * Public launch model metadata.
 *
 * The backend is the only place that may choose or call the AI model.
 * Keeping this client-side module read-only prevents drift between the
 * product UI and the server-side model that was validated for launch.
 */

const LAUNCH_MODEL = 'medgemma-4b-it';

const getActiveModel = (): string => LAUNCH_MODEL;

export const getModelInfo = () => ({
  modelId: getActiveModel(),
  isMedgemma: getActiveModel().startsWith('medgemma'),
  source: 'backend-default',
  defaultModel: LAUNCH_MODEL,
});

export { getActiveModel };
