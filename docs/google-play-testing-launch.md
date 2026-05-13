# Google Play Testing Launch Checklist

## Recommended Track

Start with **Internal testing** for CamDiag. Google Play supports internal testing for up to 100 testers and lets a new Android App Bundle become available to testers quickly. Use closed testing after the first QA group confirms install, login, camera, App Check, and AI review flows.

## App Identity

- App name: CamDiag
- Package name: `com.ndnanalytics.camdiag`
- Category: Medical
- App type: App
- Pricing: Free
- Default language: English
- Website: `https://www.ndnanalytics.com`
- Privacy policy: `https://camdiag-c7e78.web.app/privacy.html`
- Testing URL: `https://camdiag-c7e78.web.app/`

## Store Listing Draft

Short description:

```text
AI-assisted clinical review and medication safety support for Cameroon healthcare workers.
```

Full description:

```text
CamDiag helps healthcare workers review medical documents, lab results, RDTs, prescriptions, and medication safety information in Cameroon-focused workflows.

CamDiag provides possible findings for clinician review. It does not diagnose, prescribe, replace emergency care, or replace licensed clinical judgment.

Testing focus:
- Google sign-in and account setup
- Camera and gallery document capture
- Emergency triage gate
- Image quality checks
- AI-assisted document review
- Medication safety and interaction workflows
- Patient record save/review flows
```

## Internal Testing Steps

1. Create app in Play Console using package name `com.ndnanalytics.camdiag`.
2. Select app type **App**, category **Medical**, free pricing, and default language English.
3. Upload `android/app-release-bundle.aab` to **Testing > Internal testing**.
4. Create an internal tester email list with up to 100 Google accounts.
5. Add feedback email: `support@ndnanalytics.com`.
6. Review and roll out the internal testing release.
7. Share the opt-in link with testers.
8. Confirm testers can install, sign in, scan, pass consent, and complete AI review.

## Current Android Build

- Android App Bundle: `android/app-release-bundle.aab`
- Package name: `com.ndnanalytics.camdiag`
- Version code: `2`
- Version name: `2`
- Upload key SHA-256: `91:BF:23:8A:25:33:DC:D8:FA:0E:FA:7C:32:AA:45:05:EB:AF:3C:26:AE:16:94:2D:5D:13:A2:8E:60:64:3E:6E`
- Digital Asset Links: `https://camdiag-c7e78.web.app/.well-known/assetlinks.json`
- Privacy policy: `https://camdiag-c7e78.web.app/privacy.html`

## Before Closed Testing

- Verify Firebase Auth authorized domains include the Play/TWA launch domain.
- Verify App Check behavior in Android/TWA context before enforcing in production.
- Verify Digital Asset Links at `/.well-known/assetlinks.json`.
- Run `npm run test:rules` on a machine with Java available.
- Confirm Play Console Data safety answers match Firebase, Google Cloud, and AI processing behavior.
- After the first Play Console upload, copy the **App signing certificate** SHA-256 fingerprint from **Setup > App integrity** and add it to `public/.well-known/assetlinks.json`. Play-installed apps use the Play app signing certificate, while the local build uses the upload key.
- Keep `android/android.keystore` and release artifacts out of Git. Store the keystore and password in a secure vault because future updates must be signed with the same upload key unless Google Play resets it.

## Notes

- Internal testing may not require a fully completed store listing, but the package name is fixed after the first artifact upload.
- If the developer account is a personal account created after November 13, 2023, Google requires a closed test with at least 12 opted-in testers for at least 14 continuous days before production access.
