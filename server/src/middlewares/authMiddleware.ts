import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'MEMBER';
  memberId?: string;
  staffId?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'gymmate_super_secret_access_jwt_key_2026_change_in_prod';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No Bearer token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Fetch user with member or staff relation to provide complete context
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        member: true,
        staff: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'User associated with this token no longer exists.' });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'STAFF' | 'MEMBER',
      memberId: user.member?.id,
      staffId: user.staff?.id,
      name: user.member?.name || user.staff?.name || user.email.split('@')[0],
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Access token expired.', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ error: 'Invalid authentication token.' });
  }
}
