import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Ambassador } from '../models/Ambassador';
import { Admin } from '../models/Admin';

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

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No session found.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    // Database verification: verify user actively exists and is active
    if (decoded.role === 'ambassador') {
      const ambassador = await Ambassador.findById(decoded.id).select('status srid email name');
      if (!ambassador) {
        return res.status(401).json({
          success: false,
          message: 'Ambassador account no longer exists. Please log in again.',
        });
      }

      if (ambassador.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your ambassador account has been suspended by the administrator.',
        });
      }

      // Enforce verified DB SRID
      decoded.srid = ambassador.srid;
      decoded.name = ambassador.name;
    } else if (
      decoded.role === 'admin' ||
      decoded.role === 'superadmin' ||
      (decoded.role as string) === 'super_admin'
    ) {
      const admin = await Admin.findById(decoded.id).select('email name');
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin account does not exist. Please log in again.',
        });
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid. Please log in again.' });
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
