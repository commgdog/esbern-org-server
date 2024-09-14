import { NextFunction, Request, Response } from 'express';
import Role from './RoleModel.js';
import { ModelChange } from '../audit/AuditModel.js';

export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = new Role();
    const errors = await role.validate(req.body);
    if (errors.length) {
      return res.status(400).json(errors);
    }
    await role.create();
    req.auditor.add(`Role "${role.name}" created`, 'Role', role.roleId);
    return res.status(200).json(role.forClient());
  } catch (err) {
    return next(err);
  }
};

export const readRoles = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    return res.status(200).json(await Role.readAll());
  } catch (err) {
    return next(err);
  }
};

export const readRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = new Role({
      roleId: req.params.roleId,
    });
    if (!(await role.read())) {
      return res.status(404).json({ message: 'Role not found' });
    }
    return res.status(200).json(role.forClient());
  } catch (err) {
    return next(err);
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = new Role({
      roleId: req.params.roleId,
    });
    if (!(await role.read())) {
      return res.status(404).json({ message: 'Role not found' });
    }
    const changes = new ModelChange({ ...role });
    const errors = await role.validate(req.body);
    if (errors.length) {
      return res.status(400).json(errors);
    }
    await role.update();
    changes.after = { ...role };
    req.auditor.add(
      `Role "${role.name}" updated`,
      'Role',
      role.roleId,
      changes,
    );
    return res.status(200).json(role.forClient());
  } catch (err) {
    return next(err);
  }
};

export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = new Role({
      roleId: req.params.roleId,
    });
    if (!(await role.read())) {
      return res.status(404).json({ message: 'Role not found' });
    }
    await role.delete();
    req.auditor.add(`Role "${role.name}" deleted`, 'Role', role.roleId);
    return res.status(200).json({ message: 'Role deleted' });
  } catch (err) {
    return next(err);
  }
};
