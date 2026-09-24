import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import DiagnosticHub from '../components/DiagnosticHub';
import { resetSensitiveSession } from '../services/session';
import { encounter } from './clinicalFixtures';
const mocks=vi.hoisted(()=>({list:vi.fn(),uid:'user-a'}));
vi.mock('../contexts/AuthContext',()=>({useAuth:()=>({user:{uid:mocks.uid,canUseClinicalTools:true}})}));
vi.mock('../services/medgemma',()=>({listEncounters:mocks.list}));
vi.mock('framer-motion',async()=>{const {createFramerMotionMock}=await vi.importActual<typeof import('./mocks')>('./mocks');return createFramerMotionMock();});
describe('Clinical dashboard history',()=>{
  beforeEach(()=>{vi.clearAllMocks();localStorage.clear();resetSensitiveSession();mocks.uid='user-a';mocks.list.mockResolvedValue({items:[encounter],nextCursor:null});});
  it('displays saved encounters with review state instead of legacy diagnosis summaries',async()=>{render(<MemoryRouter><TranslationProvider><DiagnosticHub/></TranslationProvider></MemoryRouter>);expect(await screen.findByText(encounter.patientId)).toBeVisible();expect(screen.getByText('draft')).toBeVisible();});
  it('partitions history by account and ignores stale requests',async()=>{let resolve!:(v:{items:typeof encounter[];nextCursor:null})=>void;mocks.list.mockReturnValueOnce(new Promise(r=>{resolve=r;}));const view=render(<MemoryRouter><TranslationProvider><DiagnosticHub/></TranslationProvider></MemoryRouter>);mocks.uid='user-b';mocks.list.mockRejectedValue(new Error('Unavailable'));view.rerender(<MemoryRouter><TranslationProvider><DiagnosticHub/></TranslationProvider></MemoryRouter>);resolve({items:[encounter],nextCursor:null});await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Could not load'));expect(screen.queryByText(encounter.patientId)).not.toBeInTheDocument();});
});
