import { NextFunction, Request, Response } from 'express';
import ModelChange from '../util/model-change.js';

export interface Audit {
  message: string | null;
  modelType: string | null;
  modelId: string | null;
  changes?: ModelChange;
}

export class Auditor {
  audits: Audit[] = [];

  add(
    message: string | null,
    modelType: string | null,
    modelId: string | null,
    changes?: ModelChange
  ): void {
    this.audits.push({
      message,
      modelType,
      modelId,
      changes,
    });
  }
}

export default async (req: Request, _res: Response, next: NextFunction) => {
  req.auditor = new Auditor();
  return next();
};
