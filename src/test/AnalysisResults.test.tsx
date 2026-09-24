import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import AnalysisResults from '../components/AnalysisResults';
import { useAppStore } from '../store/useAppStore';
import { resetSensitiveSession } from '../services/session';
import { analyzedDetail, analysisJob, timestamp } from './clinicalFixtures';
const mocks=vi.hoisted(()=>({get:vi.fn(),sign:vi.fn(),uid:'user-a'}));
vi.mock('../contexts/AuthContext',()=>({useAuth:()=>({user:{uid:mocks.uid,canUseClinicalTools:true}})}));
vi.mock('../services/medgemma',()=>({getEncounter:mocks.get,signClinicalReview:mocks.sign}));
const show=()=>render(<MemoryRouter><TranslationProvider><AnalysisResults/></TranslationProvider></MemoryRouter>);
describe('Authoritative analysis report',()=>{
  beforeEach(()=>{vi.clearAllMocks();localStorage.clear();mocks.uid='user-a';resetSensitiveSession();useAppStore.setState({activeEncounter:analyzedDetail.encounter,activeJob:analysisJob});mocks.get.mockResolvedValue(analyzedDetail);});
  it('labels saved but unreviewed output and includes printable source provenance',async()=>{show();await screen.findByText(/Saved on server/);expect(screen.getByText(/UNREVIEWED/)).toBeVisible();expect(screen.getByText('Medication safety: not assessed')).toBeVisible();expect(screen.getByText(/SHA-256 1:/)).toHaveTextContent('a'.repeat(64));const print=vi.spyOn(window,'print').mockImplementation(()=>{});fireEvent.click(screen.getByRole('button',{name:'Print / Save PDF'}));expect(print).toHaveBeenCalledOnce();print.mockRestore();});
  it('does not claim a result is saved when the server fetch fails',async()=>{mocks.get.mockRejectedValue(new Error('Record unavailable'));show();expect(await screen.findByRole('alert')).toHaveTextContent('Record unavailable');expect(screen.queryByText(/Saved on server/)).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Print / Save PDF'})).not.toBeInTheDocument();});
  it('requires attestation and correction notes then reflects server reviewer identity',async()=>{show();await screen.findByText(/Saved on server/);const save=screen.getByRole('button',{name:'Save attributed review'});expect(save).toBeDisabled();fireEvent.change(screen.getByLabelText('Review disposition'),{target:{value:'corrected'}});fireEvent.click(screen.getByRole('checkbox'));expect(save).toBeDisabled();fireEvent.change(screen.getByLabelText('Review notes / corrections'),{target:{value:'Synthetic correction.'}});mocks.sign.mockResolvedValue({id:'review-1'});mocks.get.mockResolvedValue({...analyzedDetail,reviews:[{id:'review-1',analysisId:'analysis-1',attested:true,disposition:'corrected',notes:'Synthetic correction.',reviewerUid:'verified-reviewer',reviewedAt:timestamp}]});fireEvent.click(save);await screen.findByText(/verified-reviewer/);expect(mocks.sign).toHaveBeenCalledWith('enc-1',expect.objectContaining({analysisId:'analysis-1',disposition:'corrected',attested:true,notes:'Synthetic correction.'}),expect.any(AbortSignal));});
  it('cannot show a late old-account report after an identity transition',async()=>{let resolve!:(v:typeof analyzedDetail)=>void;mocks.get.mockReturnValueOnce(new Promise(r=>{resolve=r;}));const view=show();mocks.uid='user-b';mocks.get.mockRejectedValue(new Error('No access'));view.rerender(<MemoryRouter><TranslationProvider><AnalysisResults/></TranslationProvider></MemoryRouter>);resolve(analyzedDetail);await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('No access'));expect(screen.queryByText('Synthetic document finding · uncertain')).not.toBeInTheDocument();});
});
