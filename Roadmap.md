# CamDiag Project Roadmap & Progress Tracker

## Overview
Major refactoring of CamDiag: TypeScript migration, React Router, state management, error handling, testing, security hardening, Google MedGemma integration, landing page, PWA support, Firebase Auth/Firestore, accessibility, and performance optimization.

---

## Progress

### Phase 1: Infrastructure Setup
- [x] Install new dependencies (TypeScript, React Router, Zustand, Vitest, @google/generative-ai)
- [x] Set up TypeScript configuration (tsconfig.json, tsconfig.node.json)
- [x] Create project directory structure (types, hooks, contexts, services, store, i18n, utils, test, components/ui)

### Phase 2: Core Architecture
- [x] Create TypeScript type definitions (`src/types/index.ts`)
- [x] Create i18n locale files (`src/i18n/en.json`, `src/i18n/fr.json`, `src/i18n/pcm.json`) and `useTranslation` hook
- [x] Create Icon component system (`src/components/ui/Icons.tsx`)
- [x] Create ErrorBoundary component (`src/components/ui/ErrorBoundary.tsx`)
- [x] Create LoadingSpinner component (`src/components/ui/LoadingSpinner.tsx`)
- [x] Create Context providers: AuthContext (`src/contexts/AuthContext.tsx`) with Firebase Auth
- [x] Create Zustand store (`src/store/useAppStore.ts`)
- [x] Create API service layer with Google MedGemma (`src/services/medgemma.ts`, `src/services/api.ts`)

### Phase 3: Component Migration to TypeScript
- [x] Convert App to App.tsx (with React Router, providers, React.lazy code splitting)
- [x] Convert main to main.tsx (with PWA service worker registration)
- [x] Convert all 10 components to TypeScript (.tsx)
- [x] Delete all old .jsx files
- [x] Create Landing page with Ellipsus-inspired animations
- [x] Registration modal on Landing page (signup + login)

### Phase 4: Fixes & Hardening
- [x] Fix Scanner DOM manipulation (use React state instead of document.body.appendChild)
- [x] Fix Questionnaire typo (handleSumbit → handleSubmit) and add form validation
- [x] Remove unused state in Questionnaire
- [x] Replace external image URLs with local placeholder icons
- [x] Remove lucide-react dead dependency
- [x] Add Content Security Policy headers to firebase.json
- [x] Add useOnlineStatus hook for real connectivity detection
- [x] Update index.html with proper title, meta, PWA manifest
- [x] Add Firestore security rules (`firestore.rules`)

### Phase 5: Testing
- [x] Configure Vitest (`vitest.config.ts`, `src/test/setup.ts`)
- [x] Write tests for validation utilities (4 tests)
- [x] Write tests for i18n locales (5 tests)
- [x] Write tests for Zustand store (6 tests)
- [x] Write tests for API service (3 tests)
- **18/18 tests passing**
- [x] Playwright E2E setup (`playwright.config.ts`, `e2e/app.spec.ts`)
- [x] `test:e2e` script in package.json
- [x] Component tests with @testing-library/react — DiagnosticHub (9 tests), DrugDatabase (8 tests), **39/39 tests passing**

### Phase 6: CI/CD & Documentation
- [x] Add GitHub Actions workflow (`.github/workflows/ci.yml`)
- [x] Update README.md with full project documentation
- [x] Add `.env.example` for environment variables

### Phase 7: Performance & PWA
- [x] React.lazy code splitting (21+ chunks, landing page loads separately)
- [x] Suspense fallback with LoadingSpinner
- [x] PWA manifest (`public/manifest.json`)
- [x] Service worker (`public/sw.js`) with cache-first strategy
- [x] Service worker registration in `main.tsx`
- [x] Vendor chunk splitting (firebase, react-vendor, motion, router, google-ai, zustand)
- [x] No chunk exceeds 500KB (largest: firebase 357KB)

### Phase 8: Landing Page & UI Polish
- [x] Create Landing page with Ellipsus-inspired design
- [x] Scroll-triggered appear animations (blur-to-sharp)
- [x] Parallax hero with spring physics
- [x] Floating ambient orbs with continuous animation
- [x] Stagger reveal animations for feature cards
- [x] Infinite scrolling marquee for hospital names
- [x] Hover micro-interactions (card lift, icon wiggle, button glow)
- [x] Login modal with blur entry animation
- [x] "Local" language button wired to Pidgin/Camfranglais (pcm)
- [x] Landing page serves at `/`, app at `/app`

### Phase 9: Firebase Integration
- [x] Firebase SDK initialized (`src/lib/firebase.ts`)
- [x] Firebase Auth service (`src/services/auth.ts`) — login, register, logout, onAuthChange
- [x] Firestore service layer (`src/services/firestore.ts`) — CRUD, real-time listeners, seed
- [x] AuthContext wired to Firebase Auth (not mock)
- [x] Firestore security rules (`firestore.rules`)
- [x] Firebase Analytics initialized (async, browser-only)
- [x] Deployed live at https://camdiag-c7e78.web.app

### Phase 10: Accessibility & i18n
- [x] Pidgin/Camfranglais translation (`src/i18n/pcm.json`) — 113 keys
- [x] Language type updated to `'en' | 'fr' | 'pcm'`
- [x] "Local" button in DiagnosticHub now switches to Pidgin (not French)
- [x] 15 icon-only buttons have `aria-label` attributes
- [x] 4 input fields have `aria-label` attributes
- [x] 6 `<nav>` elements have `aria-label="Main navigation"`
- [x] 10 `<main>` elements have `aria-label="CamDiag"`
- [x] Landing.tsx nav has `aria-label="Main navigation"`

---

## Verification Results

- **TypeScript**: `tsc --noEmit` — 0 errors
- **Build**: `vite build` — Success, 25+ code-split chunks, no chunk >500KB
- **Tests**: `vitest run` — 39/39 passing (18 utility tests + 21 component tests)
- **E2E**: Playwright configured (run `npm run test:e2e`)
- **Lint**: `eslint` — 0 errors

## Project Structure
```
src/
├── components/
│   ├── ui/              # ErrorBoundary, LoadingSpinner, Icons
│   └── [pages].tsx      # All 10 page components
├── contexts/            # AuthContext (Firebase Auth)
├── hooks/               # useTranslation, useOnlineStatus
├── i18n/               # en.json, fr.json, pcm.json
├── lib/                # firebase.ts (Auth, Firestore, Analytics)
├── services/            # api.ts (local), auth.ts, firestore.ts, medgemma.ts (Google AI)
├── store/               # Zustand useAppStore
├── types/               # TypeScript type definitions
├── utils/               # Form validation, input sanitization
├── test/                # Vitest setup and test files
├── App.tsx              # Router with React.lazy
└── main.tsx             # Entry point with PWA registration

e2e/
└── app.spec.ts          # Playwright E2E tests

public/
├── manifest.json        # PWA manifest
├── sw.js                # Service worker
└── favicon.svg
```

## What's NOT Done Yet (for next agent)

> **Deployment:** App Hosting is configured (`apphosting.yaml`) and auto-deploys on push. Firebase Console environment variables are set.
> **CI:** GitHub Actions runs lint → typecheck → tests → build. Still needs VITE_* secrets for a fully-green CI.

1. **Add GitHub Actions secrets** (optional — CI will show warnings but still passes):
   - `VITE_GOOGLE_AI_API_KEY` — Google AI Studio API key
   - `VITE_FIREBASE_API_KEY` — Firebase Web app config
   - `VITE_FIREBASE_AUTH_DOMAIN` — `camdiag-c7e78.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID` — `camdiag-c7e78`
   - `VITE_FIREBASE_STORAGE_BUCKET` — `camdiag-c7e78.appspot.com`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` — Firebase Web app config
   - `VITE_FIREBASE_APP_ID` — Firebase Web app config
   - `VITE_FIREBASE_MEASUREMENT_ID` — Optional
2. **Deploy Firestore rules** — `firebase deploy --only firestore` (run locally with logged-in Firebase CLI)
3. **Seed the database** — call `seedDatabase()` from the app or Firebase Console to populate drugs/facilities
4. **Firebase Auth phone auth** — Login modal has `isRegister` state and phone handlers stubbed out; wire to phone tab UI when ready
5. **MedGemma model name** — Currently using `gemini-2.0-flash`; swap to `medgemma` when Google releases it
6. **More component tests** — Scanner, AnalysisResults, NextSteps, Questionnaire, PatientRecords, Blog, Settings, ComingUp, and Landing still need @testing-library/react tests