import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { AuthUser } from '../types/domain.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
