import type { Request, Response, NextFunction } from 'express';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const db = getFirestore();

export const rateLimiter = (config: RateLimitConfig) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const uid = req.uid;
    if (!uid) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const route = req.path;
    const windowStart = Date.now() - config.windowMs;

    try {
      const rateLimitRef = db.collection('rate_limits').doc(uid);
      const result = await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(rateLimitRef);
        const now = Timestamp.now();

        if (!doc.exists) {
          transaction.set(rateLimitRef, {
            [route]: [{ count: 1, windowStart }],
            updatedAt: now,
          });
          return { allowed: true, remaining: config.max - 1 };
        }

        const data = doc.data()!;
        const routeEntries: Array<{ count: number; windowStart: number }> = data[route] || [];
        const recent = routeEntries.filter((e) => e.windowStart > windowStart);

        const totalCount = recent.reduce((sum, e) => sum + e.count, 0);

        if (totalCount >= config.max) {
          return { allowed: false, remaining: 0 };
        }

        const updatedEntries = [...recent, { count: 1, windowStart: Date.now() }];
        transaction.set(rateLimitRef, {
          ...data,
          [route]: updatedEntries,
          updatedAt: now,
        });

        return { allowed: true, remaining: config.max - totalCount - 1 };
      });

      if (!result.allowed) {
        res.status(429).json({
          error: 'Too many requests. Please slow down.',
          remaining: 0,
        });
        return;
      }

      res.setHeader('X-RateLimit-Remaining', result.remaining);
      next();
    } catch {
      res.status(503).json({
        error: 'Rate limit check is temporarily unavailable. Please try again shortly.',
      });
    }
  };
};
