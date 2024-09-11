import express from 'express';
import cors from 'cors';
import setRequestId from './middleware/set-request-id.js';
import setAuditor from './middleware/set-auditor.js';
import startRequestLogging from './middleware/start-request-logging.js';
import setUserAgent from './middleware/set-user-agent.js';
import setSession from './middleware/set-session.js';
import AuditRouter from './api/audit/AuditRouter.js';
import SessionRouter from './api/session/SessionRouter.js';
import UserRouter from './api/user/UserRouter.js';
import RoleRouter from './api/role/RoleRouter.js';
import { handle404, handle500 } from './middleware/handle-error.js';

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

// Error handling
app.use(handle404);
app.use(handle500);

export default app;
