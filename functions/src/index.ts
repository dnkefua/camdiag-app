import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import express from 'express';
import cors from 'cors';
import { CORS_ALLOWED_ORIGINS, REQUEST_SIZE_LIMIT, DOCUMENT_AI_PROCESSOR_ID, GEMINI_MODEL } from './config.js';
import analyzeRouter from './routes/analyze.js';
import searchDrugRouter from './routes/searchDrug.js';
import checkInteractionsRouter from './routes/checkInteractions.js';
import transcribeRouter from './routes/transcribe.js';
import { verifyAppCheck } from './middleware/appCheck.js';
import clinicalRouter from './routes/clinical.js';
import { ClinicalError } from './services/clinicalPolicy.js';

initializeApp();

const app = express();

const getAllowedOrigins = () => CORS_ALLOWED_ORIGINS.value()
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || getAllowedOrigins().includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin not allowed'));
  },
}));
app.disable('x-powered-by');
app.use((_req,res,next) => {res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');next();});

const healthCheck = (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};

// Health check. Support both root and /api prefixes because Firebase
// strips the function name from some Cloud Functions URLs.
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);
const readiness = (_req:express.Request,res:express.Response) => {
  const configured = Boolean(DOCUMENT_AI_PROCESSOR_ID.value() && GEMINI_MODEL.value() && (process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT));
  // Configuration readiness only: never advertise clinical validation/provider health.
  res.status(configured ? 200 : 503).json({status:configured ? 'configured' : 'configuration_required',schemaVersion:'clinical-v1',providerHealth:'not_probed',clinicalApproval:'externally_governed'});
};
app.get('/ready',readiness);
app.get('/api/ready',readiness);

app.use(verifyAppCheck);
app.use(express.json({ limit: REQUEST_SIZE_LIMIT }));

// Routes. Keep both mount points so existing App Hosting builds that call
// https://...cloudfunctions.net/api/analyze continue to work immediately.
app.use('/api', analyzeRouter);
app.use('/api', searchDrugRouter);
app.use('/api', checkInteractionsRouter);
app.use('/api', transcribeRouter);
app.use('/api', clinicalRouter);
app.use('/', analyzeRouter);
app.use('/', searchDrugRouter);
app.use('/', checkInteractionsRouter);
app.use('/', transcribeRouter);
app.use('/', clinicalRouter);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});
app.use((error: unknown,_req: express.Request,res: express.Response,_next: express.NextFunction) => {
  if(error instanceof ClinicalError) {res.status(error.status).json({code:error.code,error:error.message});return;}
  const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500;
  const safeStatus = status === 413 ? 413 : status === 400 ? 400 : 500;
  console.error(JSON.stringify({event:'api_request_failed',status:safeStatus}));
  res.status(safeStatus).json({code:safeStatus === 413 ? 'PAYLOAD_TOO_LARGE' : safeStatus === 400 ? 'INVALID_REQUEST' : 'SERVICE_UNAVAILABLE',error:'The request could not be completed. Please retry or contact support.'});
});

export const api = onRequest({
  maxInstances: 10,
  memory: '1GiB',
  timeoutSeconds: 120,
}, app);
export { processClinicalJob, recoverClinicalJobs, purgeExpiredSources } from './services/clinicalJobs.js';
