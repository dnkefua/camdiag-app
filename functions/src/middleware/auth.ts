import type { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      uid?: string;
    }
  }
}

export const verifyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const idToken = authHeader.slice(7);
  if (!idToken) {
    res.status(401).json({ error: 'Empty token' });
    return;
  }

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
