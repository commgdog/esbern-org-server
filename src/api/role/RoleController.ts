import { NextFunction, Request, Response } from 'express';
import Role from './RoleModel.js';
import ModelChange from '../../util/model-change.js';

const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = new Role();
    const errors = await role.validate(req.body);
    if (errors.length) {
      return res.status(400).json(errors);
    }
    await role.create();
    req.auditor.add(
      `Role "${role.name}" created`,
      'Role',
      role.roleId,
    );
    return res.status(200).json(role.forClient());
  } catch (err: unknown) {
    return next(err);
  }
};

const readRoles = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json(
      await Role.readAll(),
    );
  } catch (err: unknown) {
    return next(err);
  }
};

const readRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = new Role({
      roleId: req.params.roleId,
    });
    if (!await role.read()) {
      return res.status(404).json({ message: 'Role not found' });
    }
    return res.status(200).json(role.forClient());
  } catch (err: unknown) {
    return next(err);
  }
};

const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = new Role({
      roleId: req.params.roleId,
    });
    if (!await role.read()) {
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
  } catch (err: unknown) {
    return next(err);
  }
};

const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = new Role({
      roleId: req.params.roleId,
    });
    if (!await role.read()) {
      return res.status(404).json({ message: 'Role not found' });
    }
    await role.delete();
    req.auditor.add(
      `Role "${role.name}" deleted`,
      'Role',
      role.roleId,
    );
    return res.status(200).json({ message: 'Role deleted' });
  } catch (err: unknown) {
    return next(err);
  }
};

export {
  createRole,
  readRoles,
  readRole,
  updateRole,
  deleteRole,
};
