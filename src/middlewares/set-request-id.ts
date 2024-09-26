import { NextFunction, Request, Response } from 'express';
import { uuidv7 } from 'uuidv7';

export default (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.requestId = uuidv7();
  res.set('X-Request-Id', req.requestId);
  return next();
};
