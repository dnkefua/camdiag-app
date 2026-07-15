# CamDiag Release Assurance Register

Status date: 2026-07-15  
Build: `8915971`  
Environment: Firebase project `camdiag-c7e78`

## Technical controls verified

| Control | Evidence | Status |
| --- | --- | --- |
| Enterprise OCR | Processor `aaaaa618e37f119b`, type `OCR_PROCESSOR`, stable default v2.1 | Complete |
| Runtime access | Default Functions service account has `roles/documentai.apiUser` | Complete |
| App Check client | reCAPTCHA Enterprise score key registered for approved production domains | Complete |
| App Check services | Firestore, Authentication and Storage report `ENFORCED` | Complete |
| Custom API enforcement | `APP_CHECK_ENFORCED=true`; unauthenticated/unattested transcription request returns HTTP 401 | Complete |
| Audit retention | Firestore TTL on `audit_logs.expiresAt` reports `ACTIVE`; application retention is 90 days | Complete |
| Backend deployment | Cloud Function `api` updated 2026-07-15 and health endpoint returns HTTP 200 | Complete |
| Hosting deployment | Firebase Hosting and App Hosting URLs return HTTP 200 | Complete |
| Source release | Commit `8915971` on `codex/release-document-ocr` | Complete |

## Required human approvals

These are governance decisions and cannot be self-certified by software or an AI agent.

| Approval | Required signatory | Required evidence | Status |
| --- | --- | --- | --- |
| Clinical validation | Cameroon-licensed clinical lead plus independent licensed reviewer | Frozen de-identified dataset, ground truth, error analysis and blocking-defect disposition | Awaiting dataset/reviewers |
| Privacy impact assessment | Data Protection Officer or appointed privacy lead | Data map, lawful basis, minimization, retention, subject-rights and breach process | Awaiting signature |
| Regulatory classification | Qualified Cameroon medical-device/regulatory counsel | Intended-use classification and authorization/pilot determination | Awaiting opinion |
| Data residency | Controller/DPO and security owner | Approved regions, subprocessors, transfer mechanism and storage/backup map | Awaiting approval |
| Security risk acceptance | Security owner | Threat model, penetration test, incident response and residual-risk acceptance | Awaiting testing/signature |
| Clinical safety case | Clinical safety officer | Hazard log, safety controls, validation traceability and release authorization | Awaiting signature |

## Clinical handwriting validation execution package

1. Collect de-identified documents under an approved protocol; never use live patient data without authorization.
2. Use at least 100 prescriptions with legible, difficult and ambiguous handwriting in English and French.
3. Freeze a manifest containing document hash, source class, language, quality class and two-clinician adjudicated ground truth.
4. Run the deployed OCR processor without manual correction and separately record the post-review corrected result.
5. Report word error rate and exact-match accuracy for medication name, strength, dose, decimal, unit, route, frequency, duration, allergy and date.
6. Every dangerous substitution, decimal/unit error or missed allergy is a blocking safety event regardless of aggregate score.
7. Repeat disagreement adjudication with a third licensed reviewer.
8. Attach signed reviewer records and approval decision to this register.

## Release decision

Technical deployment is complete. Clinical production use remains **not approved** until every human approval above is signed. The deployed application must remain an investigational clinician-review tool and must not be represented as validated autonomous diagnosis or prescribing software.
