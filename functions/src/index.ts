import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import express from 'express';
import cors from 'cors';
import { REQUEST_SIZE_LIMIT } from './config.js';
import analyzeRouter from './routes/analyze.js';
import searchDrugRouter from './routes/searchDrug.js';
import checkInteractionsRouter from './routes/checkInteractions.js';

initializeApp();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: REQUEST_SIZE_LIMIT }));

const healthCheck = (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};

// Health check. Support both root and /api prefixes because Firebase
// strips the function name from some Cloud Functions URLs.
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Routes. Keep both mount points so existing App Hosting builds that call
// https://...cloudfunctions.net/api/analyze continue to work immediately.
app.use('/', analyzeRouter);
app.use('/', searchDrugRouter);
app.use('/', checkInteractionsRouter);
app.use('/api', analyzeRouter);
app.use('/api', searchDrugRouter);
app.use('/api', checkInteractionsRouter);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export const api = onRequest({ maxInstances: 10 }, app);
