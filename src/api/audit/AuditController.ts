import { NextFunction, Request, Response } from 'express';
import Audit from './AuditModel.js';

const readAudits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res
      .status(200)
      .json(await Audit.getAudits(req.params.modelType, req.params.modelId));
  } catch (err: unknown) {
    return next(err);
  }
};

export default readAudits;
