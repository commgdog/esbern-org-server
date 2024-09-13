import express from 'express';
import { ping } from './PingController.js';

const router = express.Router();

router.get('/', ping);

export default router;
