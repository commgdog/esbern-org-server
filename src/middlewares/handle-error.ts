import { NextFunction, Request, Response } from 'express';
import logger from '../services/logger.js';

export const handle404 = (_req: Request, res: Response) => {
  return res.status(404).json({
    message: 'The requested endpoint was not found',
  });
};

export const handle500 = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err);
  res.status(500).json({
    message: 'An internal error occurred',
  });
  return next();
};
