import { execQuery } from '../../services/database.js';

export const AUDIT_FIELD_BLACKLIST = ['roles'];
export const MODEL_CHANGE_BLACKLIST = ['lastToken', 'tokenExpires'];
export const MODEL_CHANGE_CENSORED = ['password'];
export const CENSOR_STRING = '*****';

export interface IModelChangeRow {
  field: string;
  before: unknown;
  after: unknown;
}

export class ModelChange {
  before: Record<string, unknown> = {};

  after: Record<string, unknown> = {};

  constructor(before: Record<string, unknown>) {
    this.before = before;
  }

  getChanges() {
    const fields = Object.keys(this.before);
    const changes: IModelChangeRow[] = [];
    fields.forEach((field: string) => {
      if (MODEL_CHANGE_BLACKLIST.includes(field)) {
        return;
      }
      if (
        JSON.stringify(this.before[field]) !== JSON.stringify(this.after[field])
      ) {
        changes.push({
          field,
          before: MODEL_CHANGE_CENSORED.includes(field)
            ? CENSOR_STRING
            : this.before[field],
          after: MODEL_CHANGE_CENSORED.includes(field)
            ? CENSOR_STRING
            : this.after[field],
        });
      }
    });
    if (changes.length) {
      return JSON.stringify(changes);
    }
    return null;
  }
}

export interface IAudit {
  message: string | null;
  modelType: string | null;
  modelId: string | null;
  changes?: ModelChange;
}

export class Auditor {
  audits: IAudit[] = [];

  add(
    message: string | null,
    modelType: string | null,
    modelId: string | null,
    changes?: ModelChange,
  ): void {
    this.audits.push({
      message,
      modelType,
      modelId,
      changes,
    });
  }
}

interface IAuditRow {
  timestamp: string;
  message: string;
  changes: string;
  firstName: string;
  lastName: string;
}

export default class Audit {
  static async getAudits(
    modelType: string,
    modelId: string,
    offset: string = '0',
  ) {
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
      LIMIT
        20
      OFFSET
        ?
    `;
    const values = [
      modelType,
      modelId,
      Number(offset),
    ];
    const [rows] = await execQuery<IAuditRow[]>(query, values);
    return rows.map((row: IAuditRow) => {
      if (row.changes) {
        const changes = JSON.parse(row.changes);
        changes.forEach((change: IModelChangeRow, index: number) => {
          if (AUDIT_FIELD_BLACKLIST.includes(change.field)) {
            changes.splice(index, 1);
          }
        });
        row.changes = changes;
      }
      return row;
    });
  }
}
