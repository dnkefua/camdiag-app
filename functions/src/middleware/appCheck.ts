import type { Request, Response, NextFunction } from 'express';
import { getAppCheck } from 'firebase-admin/app-check';
import { APP_CHECK_ENFORCED } from '../config.js';

const isAppCheckEnforced = () => process.env.FUNCTIONS_EMULATOR !== 'true' || APP_CHECK_ENFORCED.value().toLowerCase() === 'true';

export const verifyAppCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!isAppCheckEnforced()) {
    next();
    return;
  }

  const token = req.header('X-Firebase-AppCheck');
  if (!token) {
    res.status(401).json({ error: 'Missing App Check token' });
    return;
  }

  try {
    await getAppCheck().verifyToken(token);
    next();
  } catch {
    console.warn(JSON.stringify({ event: 'app_check_rejected' }));
    res.status(401).json({ error: 'Invalid App Check token' });
  }
};
