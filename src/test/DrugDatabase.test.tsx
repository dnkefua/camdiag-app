import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import DrugDatabase from '../components/DrugDatabase';
import { useAppStore } from '../store/useAppStore';
import { resetSensitiveSession } from '../services/session';
import { encounter } from './clinicalFixtures';
const mocks=vi.hoisted(()=>({check:vi.fn(),search:vi.fn(),uid:'user-a'}));
vi.mock('../contexts/AuthContext',()=>({useAuth:()=>({user:{uid:mocks.uid,canUseClinicalTools:true}})}));
vi.mock('../services/medgemma',()=>({checkDrugInteractions:mocks.check,searchMedicationInfo:mocks.search}));
const show=()=>render(<MemoryRouter><TranslationProvider><DrugDatabase/></TranslationProvider></MemoryRouter>);
describe('Patient-specific medication evidence',()=>{
  beforeEach(()=>{vi.clearAllMocks();localStorage.clear();mocks.uid='user-a';resetSensitiveSession();useAppStore.setState({activeEncounter:encounter});mocks.check.mockResolvedValue({status:'not_assessed',result:'No reviewed evidence is available for this combination.',evidence:[]});});
  it('checks the explicitly confirmed list independent of search text',async()=>{show();fireEvent.change(screen.getByLabelText('Medication / active ingredient'),{target:{value:'Unselected search drug'}});fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Review selected interactions'}));await screen.findByText('Not assessed — insufficient reviewed evidence');expect(mocks.check).toHaveBeenCalledWith(['Medicine Alpha','Medicine Beta'],'en','enc-1',expect.any(AbortSignal));expect(screen.queryByText('No interactions')).not.toBeInTheDocument();});
  it('invalidates list confirmation and evidence when selection changes',async()=>{show();fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Review selected interactions'}));await screen.findByText('Not assessed — insufficient reviewed evidence');fireEvent.click(screen.getByRole('button',{name:'Remove Medicine Beta'}));expect(screen.getByRole('checkbox')).not.toBeChecked();expect(screen.getByRole('button',{name:'Review selected interactions'})).toBeDisabled();expect(screen.queryByText('Not assessed — insufficient reviewed evidence')).not.toBeInTheDocument();});
  it('requires a selected patient encounter',()=>{useAppStore.setState({activeEncounter:null});show();expect(screen.getByRole('button',{name:'Review selected interactions'})).toBeDisabled();expect(screen.getByText(/Select a patient encounter before checking/)).toBeVisible();});
  it('does not display an old-account evidence response after switching account',async()=>{let resolve!:(v:{status:string;result:string;evidence:never[]})=>void;mocks.check.mockReturnValue(new Promise(r=>{resolve=r;}));const view=show();fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Review selected interactions'}));mocks.uid='user-b';useAppStore.setState({activeEncounter:null});view.rerender(<MemoryRouter><TranslationProvider><DrugDatabase/></TranslationProvider></MemoryRouter>);resolve({status:'not_assessed',result:'PRIVATE OLD RESULT',evidence:[]});await waitFor(()=>expect(screen.getByText(/Select a patient encounter/)).toBeVisible());expect(screen.queryByText('PRIVATE OLD RESULT')).not.toBeInTheDocument();});
});
