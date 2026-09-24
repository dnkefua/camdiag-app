import type { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { ClinicalClaims } from '../contracts/clinical.js';

// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  namespace Express {
    interface Request {
      uid?: string;
      clinical?: ClinicalClaims;
      authTime?: number;
    }
  }
}

export const verifyIdentity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    const decoded = await getAuth().verifyIdToken(idToken, true);
    req.uid = decoded.uid;
    req.authTime = decoded.auth_time;
    if (isClinicalClaims(decoded)) req.clinical = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const isClinicalClaims = (claims: Record<string, unknown>): claims is Record<string, unknown> & ClinicalClaims => (
  claims.verifiedClinician === true
  && (claims.clinicalRole === 'doctor' || claims.clinicalRole === 'nurse')
  && typeof claims.organizationId === 'string'
  && /^[A-Za-z0-9_-]{1,80}$/.test(claims.organizationId)
);

export const verifyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await verifyIdentity(req, res, () => {
    if (!req.clinical) {
      res.status(403).json({ error: 'Approved clinical membership is required.', code: 'CLINICIAN_APPROVAL_REQUIRED' });
      return;
    }
    void getFirestore().collection('clinical_memberships').doc(req.uid!).get().then((membership) => {
      const current = membership.data();
      if(current?.active !== true || current.organizationId !== req.clinical!.organizationId || current.clinicalRole !== req.clinical!.clinicalRole) {
        res.status(403).json({code:'CLINICIAN_APPROVAL_REQUIRED',error:'Approved clinical membership is required.'}); return;
      }
      next();
    }).catch(() => {res.status(503).json({code:'AUTHORIZATION_UNAVAILABLE',error:'Clinical authorization is temporarily unavailable.'});});
  });
};
