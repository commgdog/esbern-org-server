import express from 'express';
import {
  createUser,
  deleteUser,
  readUser,
  readUsers,
  updateUser,
} from './UserController.js';
import authenticate from '../../middlewares/authenticate.js';
import { Permission } from '../role/RoleModel.js';

const router = express.Router();

router.post('/', authenticate(Permission.USER_CREATE), createUser);
router.get('/', authenticate(Permission.USER_READ), readUsers);
router.get('/:userId', authenticate(Permission.USER_READ), readUser);
router.patch('/:userId', authenticate(Permission.USER_UPDATE), updateUser);
router.delete('/:userId', authenticate(Permission.USER_DELETE), deleteUser);

export default router;
