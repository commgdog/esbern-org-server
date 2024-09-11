import { NextFunction, Request, Response } from 'express';
import { PoolConnection } from 'mysql2/promise';
import dayjs from 'dayjs';
import { getConnection } from '../util/database.js';
import logger from '../util/logger.js';
import generateId from '../util/generate-id.js';
import { IAudit } from '../api/audit/AuditModel.js';

export default (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  const logRequest = async (conn: PoolConnection) => {
    const query = `
      INSERT INTO
        requests (
          requestId,
          userId,
          timestamp,
          sessionToken,
          method,
          path,
          statusCode,
          ipAddress,
          userAgent,
          durationMs
        )
      VALUES
        ?
    `;
    const values = [
      req.requestId,
      req.session.userId,
      dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'),
      req.session.lastToken,
      req.method,
      req.originalUrl.split('?')[0],
      res.statusCode,
      req.socket.remoteAddress,
      req.userAgent,
      Math.round(Number(process.hrtime.bigint() - start) / 1e6),
    ];
    await conn.query(query, [[values]]);
  };
  const logAudits = async (conn: PoolConnection) => {
    const query = `
      INSERT INTO
        audits (
          auditId,
          requestId,
          message,
          modelType,
          modelId,
          changes
        )
      VALUES 
        ?
    `;
    const insert: (string | null)[][] = [];
    req.auditor.audits.forEach((audit: IAudit) => {
      insert.push([
        generateId(),
        req.requestId,
        audit.message,
        audit.modelType,
        audit.modelId,
        audit.changes ? audit.changes.getChanges() : null,
      ]);
    });
    if (insert.length) {
      await conn.query(query, [insert]);
    }
  };
  res.on('finish', async () => {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();
      await logRequest(conn);
      await logAudits(conn);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      logger.error(err);
    } finally {
      conn.release();
    }
  });
  next();
};
