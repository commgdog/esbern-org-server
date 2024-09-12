import express from 'express';
import {
  createSession,
  readSession,
  deleteSession,
  changePassword,
} from './SessionController.js';
import authenticate from '../../middlewares/authenticate.js';

const router = express.Router();

router.post('/change-password', authenticate(), changePassword);
router.post('/', createSession);
router.get('/', readSession);
router.delete('/', deleteSession);

export default router;
