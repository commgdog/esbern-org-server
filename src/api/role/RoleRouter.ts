import express from 'express';
import {
  createRole,
  deleteRole,
  readRole,
  readRoles,
  updateRole,
} from './RoleController.js';
import authenticate from '../../middleware/authenticate.js';
import Permission from '../../util/permission.js';

const router = express.Router();

router.post('/', authenticate(Permission.ROLE_CREATE), createRole);
router.get('/', authenticate(Permission.ROLE_READ), readRoles);
router.get('/:roleId', authenticate(Permission.ROLE_READ), readRole);
router.patch('/:roleId', authenticate(Permission.ROLE_UPDATE), updateRole);
router.delete('/:roleId', authenticate(Permission.ROLE_DELETE), deleteRole);

export default router;
