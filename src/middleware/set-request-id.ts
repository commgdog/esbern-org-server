import { NextFunction, Request, Response } from 'express';
import generateId from '../util/generate-id.js';

export default (req: Request, res: Response, next: NextFunction) => {
  req.requestId = generateId();
  res.set('X-Request-Id', req.requestId);
  next();
};
