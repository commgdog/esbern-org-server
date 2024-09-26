import { execQuery } from '../../services/database.js';
import { RowDataPacket } from 'mysql2/promise';

export default class Dashboard {
  static async getTotalRequestCount() {
    const query = `
      SELECT
        COUNT(*) AS totalRequests
      FROM
        requests
    `;
    const [rows] = await execQuery<RowDataPacket[]>(query);
    return rows[0].totalRequests ?? 0;
  }

  static async getTotalRequestDuration() {
    const query = `
      SELECT
        SUM(durationMs) AS requestDuration
      FROM
        requests
    `;
    const [rows] = await execQuery<RowDataPacket[]>(query);
    return rows[0].requestDuration ?? 0;
  }

  static async getTotalSessionCount() {
    const query = `
      SELECT
        COUNT(DISTINCT(sessionToken)) AS sessionCount
      FROM
        requests 
    `;
    const [rows] = await execQuery<RowDataPacket[]>(query);
    return rows[0].sessionCount ?? 0;
  }
}
