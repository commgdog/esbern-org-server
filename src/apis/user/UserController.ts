import { NextFunction, Request, Response } from 'express';
import User from './UserModel.js';
import { ModelChange } from '../audit/AuditModel.js';

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = new User();
    const errors = await user.validate(req.body);
    if (errors.length) {
      return res.status(400).json(errors);
    }
    await user.create();
    req.auditor.add(
      `User "${user.username}" created`,
      'User',
      user.userId,
    );
    return res.status(200).json(user.forClient());
  } catch (err) {
    return next(err);
  }
};

export const readUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    return res.status(200).json(await User.readAll());
  } catch (err) {
    return next(err);
  }
};

export const readUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = new User({
      userId: req.params.userId,
    });
    if (!(await user.read())) {
      return res.status(404).json({
        message: 'User not found',
      });
    }
    return res.status(200).json(user.forClient());
  } catch (err) {
    return next(err);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = new User({
      userId: req.params.userId,
    });
    if (!(await user.read())) {
      return res.status(404).json({
        message: 'User not found',
      });
    }
    if (user.userId === req.session.userId && req.body.isInactive) {
      return res
        .status(400)
        .json({
          message: 'Cannot make your own account inactive',
        });
    }
    const changes = new ModelChange({ ...user });
    changes.before.roleNames = await user.readRoleNames();
    const errors = await user.validate(req.body);
    if (errors.length) {
      return res.status(400).json(errors);
    }
    await user.update();
    changes.after = { ...user };
    changes.after.roleNames = await user.readRoleNames();
    req.auditor.add(
      `User "${user.username}" updated`,
      'User',
      user.userId,
      changes,
    );
    return res.status(200).json(user.forClient());
  } catch (err) {
    return next(err);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = new User({
      userId: req.params.userId,
    });
    if (!(await user.read())) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.userId === req.session.userId) {
      return res
        .status(400)
        .json({
          message: 'Cannot delete your own account',
        });
    }
    await user.delete();
    req.auditor.add(`User "${user.username}" deleted`, 'User', user.userId);
    return res.status(200).json({
      message: 'User deleted',
    });
  } catch (err) {
    return next(err);
  }
};
