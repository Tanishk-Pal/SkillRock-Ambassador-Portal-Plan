import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  role: 'ambassador' | 'admin' | 'superadmin' | 'super_admin';
  email: string;
  srid?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'skillrock_ssap_secret_jwt_key_2026_9812497124';

export const signToken = (payload: AuthUser): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (
    !req.user ||
    (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'super_admin')
  ) {
    return res.status(403).json({ success: false, message: 'Forbidden. Admin privileges required.' });
  }
  next();
};

export const requireAmbassador = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ambassador') {
    return res.status(403).json({ success: false, message: 'Forbidden. Ambassador account required.' });
  }
  next();
};
