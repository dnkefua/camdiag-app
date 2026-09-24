# CamDiag Release Assurance Register

## 2026-09-23 engineering update

The July entries below are historical observations, not proof of the current deployment. The September review found Firebase Hosting serving the existing site, while the deployed clinical API returned HTTP 500 and the App Hosting path returned 5xx. A read-only Cloud Run check found the API revision marked Ready and project billing enabled; that does not explain or resolve the API failure. The new local code has not been deployed. Keep clinical processing unavailable until deployment, readiness checks, and the approvals below are complete.

Current proposed release scope: investigational, clinician-assisted review of text documents supplied as JPEG/PNG/WebP pages. X-ray, RDT/test-strip and body-image interpretation, autonomous diagnosis, prescribing, offline AI, and medication safety clearance are excluded. Medication evidence must be reviewed, versioned, cited and current; otherwise the product returns **not assessed**. The synthetic engineering tests do not establish clinical accuracy.

| 2026-09-23 local gate | Result |
| --- | --- |
| Frontend typecheck/build | Passed |
| Frontend unit tests | 130 passed across 23 files |
| Backend behavior tests | 35 passed across 4 files |
| Firestore/Storage emulator assertions | 12 passed; CLI exited successfully in local Windows sandbox |
| Browser synthetic workflow | 9 passed with an external local Vite server |
| Hosting/offline/release-smoke tests | 8 passed |
| Tracked/untracked signing and credential scan | Passed local pattern scan; not a substitute for a full secret scanner |
| Dependency advisory scan | Blocked by automatic approval review because npm audit discloses package/version metadata; explicit authorization required |
| Live API readiness | Existing production endpoint failed; no deployment or production data migration performed |

Release controls and migration steps are documented in [implementation and rollout](./implementation-and-rollout.md). The required clinical, privacy, regulatory, residency, security and safety approvals listed below remain unsigned. `CLINICAL_RELEASE_APPROVED=true` and the protected `production` GitHub environment are required by the manual deployment workflow after signed evidence exists. Do not use a green synthetic test run as release authorization.

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

The July build was technically deployed, but the September implementation in this working tree has **not** been deployed, and the observed live API failure is unresolved. Clinical production use remains **not approved** until the current build passes staging and deployment checks and every human approval above is signed. The application must not be represented as validated autonomous diagnosis or prescribing software.
