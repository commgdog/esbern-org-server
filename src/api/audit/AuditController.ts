import { NextFunction, Request, Response } from 'express';
import Audit from './AuditModel.js';

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelType, modelId } = req.params;
    if (!modelType || !modelId) {
      return res.status(400).json({ message: 'Missing parameters' });
    }
    return res.status(200).json(await Audit.getAudits(modelType, modelId));
  } catch (err) {
    return next(err);
  }
};
