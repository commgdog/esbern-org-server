import express from 'express';
import {
  createAnnouncement,
  deleteAnnouncement,
  readAnnouncement,
  readAnnouncements,
  updateAnnouncement,
} from './AnnouncementController.js';
import authenticate from '../../middlewares/authenticate.js';
import { Permission } from '../role/RoleModel.js';

const router = express.Router();

router.post('/', authenticate(Permission.ANNOUNCEMENT_CREATE), createAnnouncement);
router.get('/', authenticate(Permission.ANNOUNCEMENT_READ), readAnnouncements);
router.get('/:announcementId', authenticate(Permission.ANNOUNCEMENT_READ), readAnnouncement);
router.patch('/:announcementId', authenticate(Permission.ANNOUNCEMENT_UPDATE), updateAnnouncement);
router.delete('/:announcementId', authenticate(Permission.ANNOUNCEMENT_DELETE), deleteAnnouncement);

export default router;
