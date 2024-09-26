import { NextFunction, Request, Response } from 'express';
import Audit from './AuditModel.js';

export default async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { modelType, modelId, offset } = req.query;
    if (
      typeof (modelType) !== 'string'
      || typeof modelId !== 'string'
      || typeof offset !== 'string'
    ) {
      return res.status(400).json({
        message: 'Invalid request',
      });
    }
    return res.status(200).json(await Audit.getAudits(
      modelType,
      modelId,
      offset,
    ));
  } catch (err) {
    return next(err);
  }
};
