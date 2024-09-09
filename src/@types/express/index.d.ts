// noinspection JSUnusedGlobalSymbols
import Session from '../../api/session/SessionModel.js';
import { Auditor } from '../../middleware/set-auditor.js';

export {};

declare global {
  namespace Express {
    export interface Request {
      requestId: string;
      userAgent: string | null;
      session: Session;
      auditor: Auditor;
    }
  }
}
