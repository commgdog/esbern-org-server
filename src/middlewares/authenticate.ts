import { NextFunction, Request, Response } from 'express';
import { Permission } from '../apis/role/RoleModel.js';

export default (permission?: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return !req.session.isValid
      || (typeof permission !== 'undefined'
        && !req.session.hasPermission(permission))
      ? res.status(401).json({ message: 'Unauthorized' })
      : next();
  };
};
