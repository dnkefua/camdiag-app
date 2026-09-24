import { DOCUMENT_AI_LOCATION, DOCUMENT_AI_PROCESSOR_ID, DOCUMENT_AI_PROCESSOR_VERSION } from '../config.js';
import type { TranscribeRequestBody } from '../schemas/medgemma.js';
import { ClinicalError, providerFailure } from './clinicalPolicy.js';

type Vertex = { x?: number; y?: number };
type Layout = { textAnchor?: { textSegments?: Array<{ startIndex?: string; endIndex?: string }> }; confidence?: number; boundingPoly?: { normalizedVertices?: Vertex[] } };
type DocumentAiToken = { layout?: Layout; styleInfo?: { handwritten?: boolean } };
type DocumentAiPage = { pageNumber?: number; layout?: Layout; tokens?: DocumentAiToken[]; imageQualityScores?: { qualityScore?: number; detectedDefects?: Array<{ type?: string; confidence?: number }> } };
type DocumentAiResponse = { document?: { text?: string; pages?: DocumentAiPage[] }; error?: { message?: string } };

const accessToken = async () => {
  const response = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
    headers: { 'Metadata-Flavor': 'Google' },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw providerFailure(response.status);
  const body = await response.json() as { access_token?: string };
  if (!body.access_token) throw new Error('Document AI authorization returned no token.');
  return body.access_token;
};

const anchorText = (text: string, layout?: Layout) => (layout?.textAnchor?.textSegments ?? [])
  .map(({ startIndex, endIndex }) => text.slice(Number(startIndex ?? 0), Number(endIndex ?? 0)))
  .join('');

export async function transcribeDocument(request: TranscribeRequestBody, signal?: AbortSignal) {
  const processorId = DOCUMENT_AI_PROCESSOR_ID.value();
  if (!processorId) throw new Error('Document AI OCR is not configured. Set DOCUMENT_AI_PROCESSOR_ID.');
  const location = DOCUMENT_AI_LOCATION.value();
  const version = DOCUMENT_AI_PROCESSOR_VERSION.value();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (!projectId) throw new Error('Google Cloud project is not configured.');
  const token = await accessToken();

  const outputPages: Array<{
    pageNumber: number;
    sourcePageId: string;
    text: string;
    confidence: number;
    qualityScore?: number;
    qualityReasons: string[];
    tokens: Array<{ text: string; confidence: number; pageNumber: number; handwritten: boolean; boundingBox: Array<{ x: number; y: number }> }>;
  }> = [];
  let detectedLanguage: string | undefined;
  for (let inputIndex = 0; inputIndex < request.pages.length; inputIndex += 1) {
    const input = request.pages[inputIndex]!;
    const endpoint = `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}/processorVersions/${version}:process`;
    const response = await fetch(endpoint, {
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(45_000)]) : AbortSignal.timeout(45_000),
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawDocument: { mimeType: input.mimeType, content: input.contentBase64.split(',').pop() },
        processOptions: {
          ocrConfig: {
            enableNativePdfParsing: true,
            enableImageQualityScores: true,
            hints: { languageHints: [request.language] },
            premiumFeatures: { computeStyleInfo: true },
          },
        },
      }),
    });
    const data = await response.json() as DocumentAiResponse;
    if (!response.ok) throw providerFailure(response.status);
    if (!data.document || data.document.pages?.length !== 1) throw new ClinicalError('INVALID_OCR_OUTPUT',502);
    const fullText = data.document.text ?? '';
    for (const page of data.document.pages ?? []) {
      const quality = page.imageQualityScores;
      const pageNumber: number = outputPages.length + 1;
      const tokens = (page.tokens ?? []).map((tokenData) => ({
        text: anchorText(fullText, tokenData.layout),
        confidence: tokenData.layout?.confidence ?? 0,
        pageNumber,
        handwritten: Boolean(tokenData.styleInfo?.handwritten),
        boundingBox: (tokenData.layout?.boundingPoly?.normalizedVertices ?? []).map((point) => ({ x: point.x ?? 0, y: point.y ?? 0 })),
      }));
      const confidence = tokens.length ? tokens.reduce((sum, item) => sum + item.confidence, 0) / tokens.length : 0;
      outputPages.push({
        pageNumber,
        sourcePageId: input.id,
        text: anchorText(fullText, page.layout) || fullText,
        confidence,
        qualityScore: quality?.qualityScore,
        qualityReasons: (quality?.detectedDefects ?? []).filter((d) => (d.confidence ?? 0) >= 0.5).map((d) => d.type || 'quality_issue'),
        tokens,
      });
    }
    detectedLanguage ??= request.language;
  }

  if(outputPages.reduce((total,page) => total+page.text.length,0)>60_000 || Buffer.byteLength(JSON.stringify(outputPages))>750_000) throw new ClinicalError('DOCUMENT_TOO_COMPLEX',422,'Split the document into smaller encounters.');
  const requiresReview = true;
  return { documentId: crypto.randomUUID(), detectedLanguage, processorVersion: version, requiresReview, pages: outputPages };
}
