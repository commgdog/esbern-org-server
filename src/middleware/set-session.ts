import { NextFunction, Request, Response } from 'express';
import Session from '../api/session/SessionModel.js';
import logger from '../util/logger.js';

export default async (req: Request, _res: Response, next: NextFunction) => {
  if (typeof req.headers.authorization !== 'string') {
    req.session = new Session();
    return next();
  }
  const [type, token] = req.headers.authorization.split(' ');
  if (type === undefined || type !== 'Bearer' || !token) {
    req.session = new Session();
    return next();
  }
  try {
    req.session = new Session({
      lastToken: token,
    });
    await req.session.read();
    if (!req.session.isValid) {
      req.session = new Session();
    }
  } catch (err: unknown) {
    logger.error(err);
    req.session = new Session();
  }
  return next();
};
