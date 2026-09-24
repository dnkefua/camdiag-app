# CamDiag

CamDiag is an investigational, clinician-assisted document review app for Cameroon. Its current proposed clinical scope is text-bearing medical documents supplied as JPEG, PNG, or WebP pages. A verified clinician reviews the original image, corrects OCR text, then reviews and signs any AI-generated possible findings. The app is not validated for autonomous diagnosis, prescribing, X-ray interpretation, RDT/test-strip interpretation, or body-image interpretation.

The working-tree implementation is **not deployed or approved for clinical production use**. The existing live API returned HTTP 500 during the 2026-09-23 read-only check. See the [release assurance register](docs/release-assurance-register.md) and [implementation and rollout guide](docs/implementation-and-rollout.md) before any release.

## What is implemented

- Firebase Auth and App Check, with server-verified clinician claims and active organization membership. Profile fields cannot grant clinical access.
- Versioned clinical-processing consent, emergency triage, one current source manifest per encounter, bounded resumable uploads, source integrity checks, OCR correction, durable analysis jobs, saved provenance, and clinician sign-off tied to the current source and transcription.
- Server-owned Firestore records and Storage upload slots. Private source pages expire after 24 hours and are purged by a scheduled function.
- Medication reference lookup that fails closed as **not assessed** without approved, current, cited evidence. It does not establish patient-specific medication safety.
- Saved encounters, referral status, print/save-PDF reporting, account export, and a human-reviewed deletion-request workflow.
- A fixed synthetic demo, English/French clinical wording with explicit limitations, optional public-page-only analytics, and a service worker that caches only an offline notice.

## Architecture

The React/TypeScript client uses Firebase Auth and Storage. Firebase Functions owns clinical state transitions and integrates with Document AI and Vertex AI. Firestore and Storage rules block direct client mutation of authoritative clinical records. The browser keeps clinical state in memory and clears it when the signed-in identity or authority changes. Shared contracts live in `functions/src/contracts/clinical.ts`; runtime validation is also performed on API responses.

## Development

Use Node.js 20+ and npm 9+. Install dependencies with `npm install`, copy `.env.example` to `.env`, and configure public Firebase and API values. Provider credentials belong only in the Functions runtime; never place them in `VITE_` variables or browser code. Start the client with `npm run dev`.

Useful verification commands:

```bash
npm run lint
npm run typecheck
npm test
npm test --prefix functions
npm run test:rules
npm run test:ops
npm run test:e2e
npm run scan:secrets
npm run build
npm run build --prefix functions
```

The Firestore/Storage rules tests require Java and local Firebase emulator binaries. Browser tests use only synthetic fixtures. On Windows, see the rollout guide for the external-Vite-server workaround to avoid a Playwright teardown hang. None of these checks constitutes clinical validation.

## Release

The manual deployment workflow in `.github/workflows/deploy.yml` is gated by a protected production environment and approval reference. Before using it, complete the signed clinical, privacy, regulatory, residency, security, and safety approvals; rehearse staging and backup recovery; configure Storage CORS, App Check, IAM, retention, and medication evidence; and resolve the existing API 500. Do not use real patient data for engineering tests.

Private software — NDN Analytics.
