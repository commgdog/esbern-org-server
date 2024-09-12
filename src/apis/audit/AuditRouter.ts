import express from 'express';
import readAudits from './AuditController.js';
import authenticate from '../../middlewares/authenticate.js';
import { Permission } from '../role/RoleModel.js';

const router = express.Router();

router.get(
  '/:modelType/:modelId',
  authenticate(Permission.AUDIT_READ),
  readAudits
);

export default router;
