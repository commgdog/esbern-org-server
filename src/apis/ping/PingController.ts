import { NextFunction, Request, Response } from 'express';

export const ping = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    return res.status(200).json({ message: 'pong' });
  } catch (err) {
    return next(err);
  }
};
