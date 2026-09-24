import { afterEach,describe,it,expect,vi } from 'vitest';
vi.mock('../src/config.js',() => ({GEMINI_MODEL:{value:()=> 'test-model'},GEMINI_LOCATION:{value:()=> 'us-central1'},DOCUMENT_AI_PROCESSOR_ID:{value:()=> 'test-processor'},DOCUMENT_AI_LOCATION:{value:()=> 'us'},DOCUMENT_AI_PROCESSOR_VERSION:{value:()=> 'test-version'}}));
import { analyzeImage } from '../src/services/gemini.js';
import { transcribeDocument } from '../src/services/documentAi.js';
afterEach(() => {vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('provider boundaries use preserved evidence and bounded requests',() => {
  it('sends source IDs, original images, corrected transcription and context together',async() => {
    vi.stubEnv('GOOGLE_CLOUD_PROJECT','demo-clinical');const fetch=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({access_token:'test'}))).mockResolvedValueOnce(new Response(JSON.stringify({candidates:[{content:{parts:[{text:'{}'}]}}]})));vi.stubGlobal('fetch',fetch);
    await analyzeImage({documentType:'lab_result',language:'en',pages:[{id:'p1',fileName:'test.png',mimeType:'image/png',contentBase64:'synthetic'}],confirmedTranscription:'Reviewed synthetic value',patientContext:{allergies:['synthetic allergy']}});
    const request=fetch.mock.calls[1]![1];expect(request.signal).toBeInstanceOf(AbortSignal);const body=JSON.parse(request.body);expect(JSON.stringify(body)).toContain('Source page ID: p1');expect(JSON.stringify(body)).toContain('Reviewed synthetic value');expect(JSON.stringify(body)).toContain('synthetic allergy');expect(body.contents[0].parts[1].inlineData.data).toBe('synthetic');
  });
  it('redacts provider errors and marks temporary failures for bounded retry',async() => {
    vi.stubEnv('GOOGLE_CLOUD_PROJECT','demo-clinical');vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({access_token:'test'}))).mockResolvedValueOnce(new Response(JSON.stringify({error:{message:'SYNTHETIC-PHI'}}),{status:503})));
    await expect(analyzeImage({documentType:'lab_result',language:'en',confirmedTranscription:'test'})).rejects.toMatchObject({code:'PROVIDER_TEMPORARY',message:'The document service is temporarily unavailable.'});
  });
  it('rejects multi-page provider output for a declared single image page',async() => {
    vi.stubEnv('GOOGLE_CLOUD_PROJECT','demo-clinical');vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({access_token:'test'}))).mockResolvedValueOnce(new Response(JSON.stringify({document:{text:'synthetic',pages:[{},{}]}}))));
    await expect(transcribeDocument({language:'en',handwritingHint:true,pages:[{id:'p1',fileName:'synthetic.png',mimeType:'image/png',contentBase64:'synthetic'}]})).rejects.toMatchObject({code:'INVALID_OCR_OUTPUT'});
  });
});
