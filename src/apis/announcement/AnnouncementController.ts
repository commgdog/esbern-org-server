import { NextFunction, Request, Response } from 'express';
import Announcement from './AnnouncementModel.js';
import { ModelChange } from '../audit/AuditModel.js';

export const createAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const announcement = new Announcement();
    const errors = await announcement.validate(req.body);
    if (errors.length) {
      return res.status(400).json(errors);
    }
    await announcement.create();
    req.auditor.add(
      'Announcement created',
      'Announcement',
      announcement.announcementId,
    );
    return res.status(200).json(announcement.forClient());
  } catch (err) {
    return next(err);
  }
};

export const readAnnouncements = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    return res.status(200).json(await Announcement.readAll());
  } catch (err) {
    return next(err);
  }
};

export const readAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const announcement = new Announcement({
      announcementId: req.params.announcementId,
    });
    if (!await announcement.read()) {
      return res.status(404).json({
        message: 'Announcement not found',
      });
    }
    return res.status(200).json(announcement.forClient());
  } catch (err) {
    return next(err);
  }
};

export const updateAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const announcement = new Announcement({
      announcementId: req.params.announcementId,
    });
    if (!await announcement.read()) {
      return res.status(404).json({
        message: 'Announcement not found',
      });
    }
    const changes = new ModelChange({ ...announcement });
    const errors = await announcement.validate(req.body);
    if (errors.length) {
      return res.status(400).json(errors);
    }
    await announcement.update();
    changes.after = { ...announcement };
    req.auditor.add(
      'Announcement updated',
      'Announcement',
      announcement.announcementId,
      changes,
    );
    return res.status(200).json(announcement.forClient());
  } catch (err) {
    return next(err);
  }
};

export const deleteAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const announcement = new Announcement({
      announcementId: req.params.announcementId,
    });
    if (!await announcement.read()) {
      return res.status(404).json({
        message: 'Announcement not found',
      });
    }
    await announcement.delete();
    req.auditor.add(
      'Announcement deleted',
      'Announcement',
      announcement.announcementId,
    );
    return res.status(200).json({
      message: 'Announcement deleted',
    });
  } catch (err) {
    return next(err);
  }
};
