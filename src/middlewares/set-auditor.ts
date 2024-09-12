import { NextFunction, Request, Response } from 'express';
import { Auditor } from '../apis/audit/AuditModel.js';

export default async (req: Request, _res: Response, next: NextFunction) => {
  req.auditor = new Auditor();
  return next();
};
