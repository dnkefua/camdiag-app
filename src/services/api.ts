import type { Contraindication, PossibleFinding } from '../types';
import { envFlags } from '../utils/env';

// Mentions in prose, including negated mentions, are not medication evidence.
export const checkLocalContraindications = (
  _findings: PossibleFinding[]
): Contraindication | null => null;
export const isApiConfigured = (): boolean => envFlags.backend;
