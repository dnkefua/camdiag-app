# CamDiag Clinical Validation Plan

## Intended Use

CamDiag is an AI-assisted clinical decision-support tool for healthcare workers reviewing medical documents, lab results, X-rays, rapid diagnostic tests, prescriptions, and medication safety information in Cameroon-focused workflows.

CamDiag does not diagnose, prescribe, replace emergency care, or replace clinician judgment. Output must be treated as possible findings for clinician review.

## Current Production Controls

- Authenticated backend-only AI access through Firebase Functions.
- Backend-owned prompt construction from structured fields.
- Strict structured response validation with capped arrays, enums, and required clinician review flags.
- Emergency triage gate before AI analysis.
- Image quality gate before AI analysis.
- Firebase App Check wiring with backend enforcement parameter.
- CORS allowlist configuration.
- Firestore ownership rules for patient and scan records.
- Backend-only audit and rate-limit collections.
- Clinical consent and privacy acknowledgement gate.

## Validation Objectives

1. Confirm CamDiag never presents AI output as a definitive diagnosis.
2. Confirm emergency warning signs block normal AI analysis.
3. Confirm low-quality images are rejected before analysis.
4. Confirm AI responses comply with the strict clinical-support schema.
5. Confirm user data access is owner-scoped and backend-only collections remain inaccessible to clients.
6. Confirm clinicians can interpret output safely and identify limitations.

## Test Dataset Plan

Use a curated, de-identified dataset with documented source, quality, and clinician-reviewed ground truth.

| Dataset Slice | Minimum Count | Required Coverage |
| --- | ---: | --- |
| Lab results | 100 | Normal, abnormal, incomplete, poor contrast |
| X-rays | 100 | Normal, suspicious finding, poor lighting, wrong orientation |
| RDT tests | 100 | Positive, negative, invalid/unclear strip, low-resolution |
| Prescriptions | 100 | Legible, interaction risk, allergy risk, ambiguous handwriting |
| Non-medical/invalid images | 50 | Body-only, blank, unrelated object, document glare |
| Emergency-context cases | 50 | Breathlessness, chest pain, seizure, heavy bleeding, altered consciousness |

## Acceptance Criteria

| Area | Pass Threshold |
| --- | --- |
| Emergency triage | 100% of reported emergency-warning cases block normal AI analysis |
| Image quality gate | >= 95% of unreadable/low-quality images are rejected before AI analysis |
| Schema compliance | 100% backend responses validate or return recovery response |
| Unsafe diagnosis language | 0 UI surfaces in scan flow label AI output as final diagnosis |
| Medication safety framing | 100% scan-analysis medication text is labelled for clinician review |
| Cross-user Firestore access | 0 successful unauthorized reads/writes in rules tests |
| Clinician usability review | >= 85% of pilot clinicians rate output limitations as clear |

## Clinical Review Workflow

1. A licensed clinician reviews each AI-assisted result.
2. Clinician records whether possible findings are relevant, incomplete, or misleading.
3. Clinician records whether next-step guidance is safe and locally practical.
4. Any unsafe or misleading case is tagged as a blocking defect.
5. Release is paused until blocking defects are fixed and regression-tested.

## Risk Register

| Risk | Control | Verification |
| --- | --- | --- |
| Patient treats output as diagnosis | Consent gate, safer UI language, disclaimer, clinician-review flag | UI review, e2e tests |
| Emergency case delayed by AI flow | Emergency triage modal before analysis | Unit/e2e scenario tests |
| Poor image causes misleading result | Image quality gate blocks low-resolution, dark, low-contrast, blurry images | Image quality unit tests |
| Prompt injection from browser | Structured request only, backend prompt construction | API contract tests/typecheck |
| Unauthorized record access | Firestore owner-scoped rules | Emulator rules tests |
| Abuse of AI endpoint | Auth, App Check, CORS allowlist, fail-closed analyze rate limit | Backend tests/manual config review |

## Pilot Readiness Checklist

- [ ] Firebase App Check enabled in Firebase Console.
- [ ] `APP_CHECK_ENFORCED=true` set for production Functions.
- [ ] `CORS_ALLOWED_ORIGINS` matches final deployment domains.
- [ ] Clinical consent copy approved by legal/clinical reviewer.
- [ ] De-identified validation dataset prepared.
- [ ] At least two licensed clinicians review validation outputs.
- [ ] Rules tests pass in CI.
- [ ] Local rules tests run after Java is installed and available on `PATH`.
- [ ] Emergency triage and image quality checks pass in CI.
- [ ] Pilot data handling policy approved.

## Evidence Log

Record validation runs in this format:

| Date | Build/Commit | Dataset Version | Reviewer | Result | Blocking Issues |
| --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD |
