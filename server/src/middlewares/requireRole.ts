import { Request, Response, NextFunction } from 'express';

export function requireRole(...allowedRoles: ('STAFF' | 'MEMBER')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required before role check.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Role '${req.user.role}' does not have permission for this resource. Required: ${allowedRoles.join(' or ')}.`,
      });
      return;
    }

    next();
  };
}
