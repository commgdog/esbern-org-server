import express from 'express';
import authenticate from '../../middlewares/authenticate.js';
import {
  getTotalRequestCount,
  getTotalRequestDuration,
  getTotalSessionCount,
} from './DashboardController.js';

const router = express.Router();

router.get('/total-request-count', authenticate(), getTotalRequestCount);
router.get('/total-request-duration', authenticate(), getTotalRequestDuration);
router.get('/total-session-count', authenticate(), getTotalSessionCount);

export default router;
