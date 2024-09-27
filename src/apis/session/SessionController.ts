import { NextFunction, Request, Response } from 'express';
import Session from './SessionModel.js';
import User, {
  MAX_LOGIN_ATTEMPTS,
  PASSWORD_MIN_LENGTH,
} from '../user/UserModel.js';
import { ModelChange } from '../audit/AuditModel.js';
import Announcement from '../announcement/AnnouncementModel.js';
import datetime from '../../services/datetime.js';

export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = new User({
      username: req.body.username,
    });
    if (!(await user.read(true))) {
      return res.status(401).json({
        message: 'Invalid username or password',
        errors: ['username', 'password'],
      });
    }
    req.session.userId = user.userId;
    if (user.isLockedOut()) {
      return res.status(429).json({
        message: 'Account locked, try back later',
      });
    }
    if (user.loginAttemptCount >= MAX_LOGIN_ATTEMPTS) {
      user.loginAttemptCount = 0;
    }
    if (!user.verifyPassword(req.body.password)) {
      user.loginAttemptCount += 1;
      user.lastLoginAttemptAt = datetime().format('YYYY-MM-DD HH:mm:ss');
      await user.update();
      return res.status(401).json({
        message: 'Invalid username or password',
        errors: ['username', 'password'],
      });
    }
    if (user.passwordIsExpired) {
      if (!req.body.newPassword1) {
        return res.status(202).json({
          message: 'Password is expired',
        });
      }
      if (req.body.newPassword1.length < PASSWORD_MIN_LENGTH) {
        return res.status(400).json({
          message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
          errors: ['newPassword'],
        });
      }
      if (req.body.newPassword1 !== req.body.newPassword2) {
        return res.status(400).json({
          message: 'Passwords do not match',
          errors: ['newPassword'],
        });
      }
      user.setPassword(req.body.newPassword1);
      user.passwordIsExpired = false;
      await user.update();
      req.auditor.add(
        `User "${user.username}" changed password`,
        'User',
        user.userId,
      );
    }
    await req.session.create();
    user.lastToken = req.session.lastToken;
    user.tokenExpires = req.session.tokenExpires;
    user.loginAttemptCount = 0;
    user.lastLoginAttemptAt = datetime().format('YYYY-MM-DD HH:mm:ss');
    user.lifetimeLoginCount += 1;
    await user.update();
    req.auditor.add(
      `User "${user.username}" logged in`,
      'User',
      user.userId,
    );
    return res.status(200).json(req.session.forClient());
  } catch (err) {
    return next(err);
  }
};

export const readSession = (
  req: Request,
  res: Response,
) => {
  res.status(200).json(req.session.forClient());
};

export const deleteSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await req.session.delete();
    res.status(200).json(new Session().forClient());
  } catch (err) {
    return next(err);
  }
};

export const markAnnouncementAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = new User({
      userId: req.session.userId,
    });
    if (!(await user.read())) {
      return res.status(404).json({
        message: 'User not found',
      });
    }
    const announcement = new Announcement({
      announcementId: req.body.announcementId,
    });
    if (!(await announcement.read())) {
      return res.status(404).json({
        message: 'Announcement not found',
      });
    }
    await user.markAnnouncementAsRead(announcement.announcementId);
    await req.session.read();
    return res.status(200).json(req.session.forClient());
  } catch (err) {
    return next(err);
  }
};

export const changeTheme = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = new User({
      userId: req.session.userId,
    });
    if (req.body.theme !== 'light' && req.body.theme !== 'dark') {
      return res.status(400).json({
        message: 'Invalid theme',
      });
    }
    if (!(await user.read())) {
      return res.status(404).json({
        message: 'User not found',
      });
    }
    const changes = new ModelChange({ ...user });
    user.theme = req.body.theme;
    await user.update();
    changes.after = { ...user };
    req.auditor.add(
      `User "${user.username}" updated`,
      'User',
      user.userId,
      changes,
    );
    return res.status(200).json({
      message: 'Theme changed',
    });
  } catch (err) {
    return next(err);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = new User({
      userId: req.session.userId,
    });
    if (!(await user.read())) {
      return res.status(404).json({ message: 'User not found' });
    }
    const errorFields = [];
    if (typeof req.body.currentPassword !== 'string') {
      errorFields.push('currentPassword');
    }
    if (typeof req.body.password !== 'string') {
      errorFields.push('password');
    }
    if (typeof req.body.passwordConfirm !== 'string') {
      errorFields.push('passwordConfirm');
    }
    if (errorFields.length) {
      return res.status(400).json({
        message: 'Missing password',
        errorFields,
      });
    }
    if (!user.verifyPassword(req.body.currentPassword)) {
      errorFields.push('currentPassword');
      return res.status(400).json({
        message: 'Current password is incorrect',
        errorFields,
      });
    }
    if (req.body.password.length < PASSWORD_MIN_LENGTH) {
      errorFields.push('password');
      return res.status(400).json({
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        errorFields,
      });
    }
    if (req.body.password !== req.body.passwordConfirm) {
      errorFields.push('password');
      errorFields.push('passwordConfirm');
      return res.status(400).json({
        message: 'Passwords do not match',
        errorFields,
      });
    }
    user.setPassword(req.body.password);
    user.passwordIsExpired = false;
    await user.update();
    req.auditor.add(
      `User "${user.username}" changed password`,
      'User',
      user.userId,
    );
    return res.status(200).json({
      message: 'Password changed successfully',
    });
  } catch (err) {
    return next(err);
  }
};
