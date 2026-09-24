import { AnalyzeResponse } from '../schemas/medgemma.js';
import { ClinicalError } from './clinicalPolicy.js';

const normalized = (text: string) => text.replace(/\s+/g,' ').trim().toLowerCase();
export function validateClinicalOutput(raw: string, reviewedText: string, sourcePageIds: string[]) {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new ClinicalError('INVALID_PROVIDER_OUTPUT',502); }
  const validated = AnalyzeResponse.safeParse(parsed);
  if(!validated.success) throw new ClinicalError('INVALID_PROVIDER_OUTPUT',502);
  const result = validated.data;
  if(!result.markers.length && !result.possibleFindings.length) throw new ClinicalError('INCOMPLETE_ANALYSIS',422,'No supported findings were extracted. Review the source with a clinician.');
  const markerIds = new Set(result.markers.map((marker) => marker.id));
  if(markerIds.size !== result.markers.length) throw new ClinicalError('UNSUPPORTED_EVIDENCE',422);
  const text = normalized(reviewedText);
  for(const marker of result.markers) {
    if(!text.includes(normalized(marker.value))) throw new ClinicalError('UNSUPPORTED_EVIDENCE',422);
  }
  if(result.contraindications.length) throw new ClinicalError('UNAPPROVED_MEDICATION_ADVICE',422);
  for(const finding of result.possibleFindings) {
    if(!finding.observedEvidence.length || finding.markers.some((id) => !markerIds.has(id))) throw new ClinicalError('UNSUPPORTED_EVIDENCE',422);
    for(const evidence of finding.observedEvidence) {
      const match = /^page:([A-Za-z0-9_-]{1,80})\|(.+)$/.exec(evidence);
      if(!match || !sourcePageIds.includes(match[1]!) || normalized(match[2]!).length < 3 || !text.includes(normalized(match[2]!))) throw new ClinicalError('UNSUPPORTED_EVIDENCE',422);
    }
    if(finding.medicationSafetyNotes.length || finding.traditionalRemedyWarnings.length) throw new ClinicalError('UNAPPROVED_MEDICATION_ADVICE',422);
    const prose = [finding.name,finding.reasoning,...finding.recommendedNextSteps].join(' ');
    if(/\b(?:prescribe|start taking|take \d|administer|dosage|no (?:significant )?interactions|safe to (?:take|combine))\b/i.test(prose)) throw new ClinicalError('UNAPPROVED_MEDICATION_ADVICE',422);
  }
  // Output remains unreviewed; this checks references/shape, not clinical truth.
  return result;
}
