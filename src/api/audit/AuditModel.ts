import { execQuery } from '../../util/database.js';

export const AUDIT_FIELD_BLACKLIST = ['roles'];

export default class Audit {
  static async getAudits(
    modelType: string | null,
    modelId: string | null
  ): Promise<object[]> {
    const query = `
      SELECT
        timestamp,
        message,
        changes,
        firstName,
        lastName
      FROM
        audits a
      LEFT JOIN
        requests r
      ON
        a.requestId = r.requestId
      LEFT JOIN
        users u
      ON
        r.userId = u.userId
      WHERE
        modelType = ?
      AND
        modelId = ?
      ORDER BY
        timestamp DESC
    `;
    const values = [modelType, modelId];
    const [rows] = await execQuery(query, values);
    return rows.map((row: Record<string, unknown>) => {
      if (row.changes) {
        row.changes = JSON.parse(row.changes);
        row.changes.forEach((change: any, index: number) => {
          if (AUDIT_FIELD_BLACKLIST.includes(change.field)) {
            row.changes.splice(index, 1);
          }
        });
      }
      return row;
    });
  }
}
