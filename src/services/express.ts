import express from 'express';
import cors from 'cors';
import setRequestId from '../middlewares/set-request-id.js';
import setAuditor from '../middlewares/set-auditor.js';
import startRequestLogging from '../middlewares/start-request-logging.js';
import setUserAgent from '../middlewares/set-user-agent.js';
import setSession from '../middlewares/set-session.js';
import AuditRouter from '../apis/audit/AuditRouter.js';
import SessionRouter from '../apis/session/SessionRouter.js';
import UserRouter from '../apis/user/UserRouter.js';
import RoleRouter from '../apis/role/RoleRouter.js';
import PingRouter from '../apis/ping/PingRouter.js';
import { handle404, handle500 } from '../middlewares/handle-error.js';

// Initialize express
const app = express();

// Miscellaneous
app.set('etag', false);
app.disable('x-powered-by');

// Parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request middleware
app.use(cors());
app.use(setRequestId);
app.use(setAuditor);
app.use(setUserAgent);
app.use(setSession);
app.use(startRequestLogging);

// Routers
app.use('/audit', AuditRouter);
app.use('/session', SessionRouter);
app.use('/user', UserRouter);
app.use('/role', RoleRouter);
app.use('/ping', PingRouter);

// Error handling
app.use(handle404);
app.use(handle500);

export default app;
