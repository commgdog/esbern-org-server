import { NextFunction, Request, Response } from 'express';

export default (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  req.userAgent = req.get('User-Agent') ?? null;
  next();
};
