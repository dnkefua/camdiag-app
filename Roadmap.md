# CamDiag Project Roadmap & Progress Tracker

## Overview
Major refactoring of CamDiag: TypeScript migration, React Router, state management, error handling, testing, security hardening, Google MedGemma integration, landing page, and PWA support.

---

## Progress

### Phase 1: Infrastructure Setup
- [x] Install new dependencies (TypeScript, React Router, Zustand, Vitest, @google/generative-ai)
- [x] Set up TypeScript configuration (tsconfig.json, tsconfig.node.json)
- [x] Create project directory structure (types, hooks, contexts, services, store, i18n, utils, test, components/ui)

### Phase 2: Core Architecture
- [x] Create TypeScript type definitions (`src/types/index.ts`)
- [x] Create i18n locale files (`src/i18n/en.json`, `src/i18n/fr.json`) and `useTranslation` hook
- [x] Create Icon component system (`src/components/ui/Icons.tsx`)
- [x] Create ErrorBoundary component (`src/components/ui/ErrorBoundary.tsx`)
- [x] Create LoadingSpinner component (`src/components/ui/LoadingSpinner.tsx`)
- [x] Create Context providers: AuthContext (`src/contexts/AuthContext.tsx`)
- [x] Create Zustand store (`src/store/useAppStore.ts`)
- [x] Create API service layer with Google MedGemma (`src/services/medgemma.ts`, `src/services/api.ts`)

### Phase 3: Component Migration to TypeScript
- [x] Convert App to App.tsx (with React Router, providers, React.lazy code splitting)
- [x] Convert main to main.tsx (with PWA service worker registration)
- [x] Convert all 10 components to TypeScript (.tsx)
- [x] Delete all old .jsx files
- [x] Create Landing page with Ellipsus-inspired animations

### Phase 4: Fixes & Hardening
- [x] Fix Scanner DOM manipulation (use React state instead of document.body.appendChild)
- [x] Fix Questionnaire typo (handleSumbit → handleSubmit) and add form validation
- [x] Remove unused state in Questionnaire
- [x] Replace external image URLs with local placeholder icons
- [x] Remove lucide-react dead dependency
- [x] Add Content Security Policy headers to firebase.json
- [x] Add useOnlineStatus hook for real connectivity detection
- [x] Update index.html with proper title, meta, PWA manifest

### Phase 5: Testing
- [x] Configure Vitest (`vitest.config.ts`, `src/test/setup.ts`)
- [x] Write tests for validation utilities (4 tests)
- [x] Write tests for i18n locales (5 tests)
- [x] Write tests for Zustand store (6 tests)
- [x] Write tests for API service (3 tests)
- **18/18 tests passing**

### Phase 6: CI/CD & Documentation
- [x] Add GitHub Actions workflow (`.github/workflows/ci.yml`)
- [x] Update README.md with full project documentation
- [x] Add `.env.example` for environment variables

### Phase 7: Performance & PWA
- [x] React.lazy code splitting (21 chunks, landing page loads separately)
- [x] Suspense fallback with LoadingSpinner
- [x] PWA manifest (`public/manifest.json`)
- [x] Service worker (`public/sw.js`) with cache-first strategy
- [x] Service worker registration in `main.tsx`

### Phase 8: Landing Page & UI Polish
- [x] Create Landing page with Ellipsus-inspired design
- [x] Scroll-triggered appear animations (blur-to-sharp)
- [x] Parallax hero with spring physics
- [x] Floating ambient orbs with continuous animation
- [x] Stagger reveal animations for feature cards
- [x] Infinite scrolling marquee for hospital names
- [x] Hover micro-interactions (card lift, icon wiggle, button glow)
- [x] Login modal with blur entry animation
- [x] "Local" language button wired up (maps to French)
- [x] Landing page serves at `/`, app at `/app`

---

## Verification Results

- **TypeScript**: `tsc --noEmit` — 0 errors
- **Build**: `vite build` — Success, 21 code-split chunks
- **Tests**: `vitest run` — 18/18 passing
- **Lint**: `eslint` — 0 errors (2 warnings, acceptable)

## Project Structure
```
src/
├── components/
│   ├── ui/              # ErrorBoundary, LoadingSpinner, Icons
│   └── [pages].tsx      # All 10 page components
├── contexts/            # AuthContext
├── hooks/               # useTranslation, useOnlineStatus
├── i18n/               # en.json, fr.json
├── services/            # api.ts (local), medgemma.ts (Google AI)
├── store/               # Zustand useAppStore
├── types/               # TypeScript type definitions
├── utils/               # Form validation, input sanitization
├── test/                # Vitest setup and test files
├── App.tsx              # Router with React.lazy
└── main.tsx             # Entry point with PWA registration

public/
├── manifest.json        # PWA manifest
├── sw.js                # Service worker
└── favicon.svg
```

## What's NOT Done Yet (for next agent)

1. **Real backend API** — Currently mock data in store; needs API integration for production
2. **E2E tests** — No Playwright/Cypress tests yet
3. **Real auth** — AuthContext has login/logout but no real auth provider (Firebase Auth recommended)
4. **Accessibility audit** — Add more aria-labels throughout components
5. **MedGemma model name** — Currently using `gemini-2.0-flash`; swap to `medgemma` when Google releases it
6. **Full Pidgin/local language translation** — "Local" button currently maps to French; full Camfranglais translation would need a `pcm.json` file