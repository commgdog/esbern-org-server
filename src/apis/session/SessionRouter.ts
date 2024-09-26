import express from 'express';
import {
  createSession,
  readSession,
  deleteSession,
  changeTheme,
  changePassword,
  markAnnouncementAsRead,
} from './SessionController.js';
import authenticate from '../../middlewares/authenticate.js';

const router = express.Router();

router.post('/mark-announcement-read', authenticate(), markAnnouncementAsRead);
router.post('/change-theme', authenticate(), changeTheme);
router.post('/change-password', authenticate(), changePassword);
router.post('/', createSession);
router.get('/', readSession);
router.delete('/', deleteSession);

export default router;
