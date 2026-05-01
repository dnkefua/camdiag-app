# CamDiag - AI-Powered Medical Diagnostic Hub

CamDiag is an AI-powered diagnostic assistance application designed for Cameroon's healthcare system. It leverages Google's MedGemma (via the Gemini API) to provide medical image analysis, drug interaction checking, and clinical decision support.

## Features

- **AI Medical Scan Analysis** - Scan lab results, X-rays, and RDT tests using the device camera
- **Drug Database** - Browse medications available in Cameroon, including traditional remedies (contri-medicine)
- **Drug Interaction Checking** - Automatic contraindication detection across recommended medications
- **Bilingual Support** - Full English/French interface
- **Nearby Facilities** - Find clinics, hospitals, pharmacies, and telehealth providers
- **Patient Records** - Track diagnostic history
- **Medical Feedback** - Gamified questionnaire for community health data
- **Blog & News** - Health-related content for Cameroon
- **Offline Awareness** - Detects and displays connection status

## Tech Stack

- **React 19** + **TypeScript**
- **React Router v7** - URL-based navigation
- **Zustand** - Global state management
- **Tailwind CSS 3** - Styling
- **Framer Motion** - Animations
- **Firebase Functions** - Server-side MedGemma / Gemini proxy
- **Vitest** + **React Testing Library** - Testing
- **Firebase App Hosting** - Web deployment

## Project Structure

```
src/
├── components/
│   ├── ui/          # ErrorBoundary, LoadingSpinner, Icons
│   ├── DiagnosticHub.tsx
│   ├── Scanner.tsx
│   ├── AnalysisResults.tsx
│   ├── NextSteps.tsx
│   ├── DrugDatabase.tsx
│   ├── PatientRecords.tsx
│   ├── Questionnaire.tsx
│   ├── Blog.tsx
│   ├── ComingUp.tsx
│   └── Settings.tsx
├── contexts/        # AuthContext
├── hooks/           # useTranslation, useOnlineStatus
├── i18n/            # en.json, fr.json
├── services/        # api.ts (local), medgemma.ts (Google AI)
├── store/           # Zustand useAppStore
├── types/           # TypeScript type definitions
├── utils/           # Form validation, input sanitization
├── test/            # Vitest setup and test files
├── App.tsx          # Router setup
└── main.tsx         # Entry point with providers
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and add the public Firebase, Maps, and backend URL values:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=https://us-central1-<project-id>.cloudfunctions.net/api
```

The Gemini/MedGemma API key is server-only. Configure it as `GEMINI_API_KEY` for Firebase Functions, never as a `VITE_*` browser variable.

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
npm test           # Run tests once
npm run test:watch # Watch mode
npm run test:coverage # With coverage
```

### Linting & Type Check

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript check
```

## MedGemma Integration

CamDiag integrates with Google's MedGemma model through the Gemini API for:

1. **Medical Image Analysis** - Upload scan images and receive AI-assisted diagnostic suggestions
2. **Drug Interaction Checking** - Query medication combinations for potential contraindications
3. **Medication Information** - Search for detailed medication data including Cameroon availability

The integration uses the `@google/generative-ai` SDK only inside Firebase Functions with the `medgemma-4b-it` launch model. Browser clients call the authenticated backend only; responses are parsed and validated server-side before returning to the app.

**Important:** Always include medical disclaimers. CamDiag is a decision support tool, not a replacement for professional medical diagnosis.

## Internationalization

Translation files are in `src/i18n/`:
- `en.json` - English
- `fr.json` - French

To add a new language, create a new JSON file and update the `Language` type in `src/types/index.ts`.

## Deployment

The web app is deployed by Firebase App Hosting from the connected GitHub branch using `apphosting.yaml`.

Backend services are deployed separately:

```bash
firebase deploy --only functions,firestore:rules
```

Make sure `.firebaserc` is configured with your Firebase project ID and App Hosting has the public web env vars configured.

## Security

- Content Security Policy headers are configured in `firebase.json`
- Input sanitization is applied to all user-submitted text
- AI analysis and drug interaction checks require Firebase Auth and go through backend rate limits/audit logging
- Unauthenticated users can only access the no-AI demo flow
- Medical disclaimers are prominently displayed throughout the application

## License

Private - NDN Analytics
