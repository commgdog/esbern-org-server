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
