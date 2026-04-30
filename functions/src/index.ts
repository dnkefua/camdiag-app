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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', analyzeRouter);
app.use('/api', searchDrugRouter);
app.use('/api', checkInteractionsRouter);

// 404 handler
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export const api = onRequest({ maxInstances: 10 }, app);
