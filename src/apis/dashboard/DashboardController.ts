import { NextFunction, Request, Response } from 'express';
import Dashboard from './DashboardModel.js';

export const getTotalRequestCount = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    return res.status(200).json({
      count: await Dashboard.getTotalRequestCount(),
    });
  } catch (err) {
    return next(err);
  }
};

export const getTotalRequestDuration = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    return res.status(200).json({
      count: await Dashboard.getTotalRequestDuration(),
    });
  } catch (err) {
    return next(err);
  }
};

export const getTotalSessionCount = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    return res.status(200).json({
      count: await Dashboard.getTotalSessionCount(),
    });
  } catch (err) {
    return next(err);
  }
};
