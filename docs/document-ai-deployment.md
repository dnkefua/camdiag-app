# CamDiag Document AI deployment

The application now uses a staged pipeline: document ingestion, Enterprise Document OCR, clinician transcription confirmation, then Vertex AI-assisted clinical review.

## Required cloud configuration

1. Enable Document AI and Vertex AI in the same controlled Google Cloud project.
2. Create an Enterprise Document OCR processor in an approved region.
3. Pin `pretrained-ocr-v2.1-2024-08-07` for reproducible behavior.
4. Grant the Functions runtime service account only `Document AI API User` and the minimum Vertex AI role required.
5. Configure Functions parameters:
   - `DOCUMENT_AI_LOCATION` (`us`, `eu`, or another approved supported location)
   - `DOCUMENT_AI_PROCESSOR_ID`
   - `DOCUMENT_AI_PROCESSOR_VERSION=pretrained-ocr-v2.1-2024-08-07`
   - `GEMINI_LOCATION`
   - `GEMINI_MODEL`
   - `AUDIT_LOG_RETENTION_DAYS` (default `90`)
6. Enable Firebase App Check enforcement and deploy Firestore rules.
7. Configure a Firestore TTL policy on `audit_logs.expiresAt`.

## Clinical release gates

- Validate OCR on a de-identified, representative set of Cameroon prescriptions and clinical documents in English and French.
- Report character/word error rate plus medication-name, dose, decimal, unit, allergy, and date accuracy separately.
- Test poor lighting, glare, folds, rotation, mixed print/handwriting, low-cost Android cameras, PDFs, TIFFs, and multi-page documents.
- Define mandatory abstention thresholds. The current UI requires review below 90% confidence and whenever handwriting is detected; clinical validation must confirm or tighten this threshold.
- Complete privacy impact, threat-model, data-residency, retention, medical-device/regulatory, incident-response, and clinical-safety review with qualified local counsel and clinical leadership.
- Do not publish accuracy, latency, adoption, uptime, institutional endorsement, or medical-model claims until supported by controlled evidence.

## Data handling

The current implementation sends page content directly to authenticated Cloud Functions and does not persist source documents. For large-scale production, move binaries to a private, per-user Cloud Storage path using resumable uploads, short-lived references, malware scanning, lifecycle deletion, and restrictive Storage Rules. Never place document contents or patient identifiers in analytics or response-preview logs.
