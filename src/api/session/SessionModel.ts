import dayjs from 'dayjs';
import generateId from '../../util/generate-id.js';
import { execQuery } from '../../util/database.js';

const SESSION_TIMEOUT_LENGTH = 900;

const generateExpiration = () =>
  dayjs().add(SESSION_TIMEOUT_LENGTH, 'second').format('YYYY-MM-DD HH:mm:ss');

export default class Session {
  lastToken: string | null = null;

  tokenExpires: string | null = null;

  userId: string | null = null;

  username: string | null = null;

  email: string | null = null;

  firstName: string | null = null;

  lastName: string | null = null;

  passwordIsExpired: boolean = false;

  homePage: string = 'dashboard';

  permissions: string[] = [];

  isValid: boolean = false;

  constructor(properties: object = {}) {
    Object.assign(this, properties);
  }

  async read(touch: boolean = true): Promise<boolean> {
    if (!this.lastToken) {
      this.isValid = false;
      return false;
    }
    const query = `
      SELECT
        lastToken,
        tokenExpires,
        userId,
        username,
        email,
        firstName,
        lastName,
        passwordIsExpired,
        homePage
      FROM
        users
      WHERE
        isInactive = 0
      AND
        lastToken = ?
      AND
        tokenExpires > NOW()
    `;
    const values = [this.lastToken];
    const [rows] = await execQuery(query, values);
    if (rows.length === 1) {
      if (touch) {
        this.userId = rows[0].userId;
        this.lastToken = rows[0].lastToken;
        await this.touch();
        rows[0].tokenExpires = this.tokenExpires;
      }
      rows[0].passwordIsExpired = !!rows[0].passwordIsExpired;
      Object.assign(this, rows[0]);
      this.permissions = await this.readPermissions();
      this.isValid = true;
      return true;
    }
    this.isValid = false;
    return false;
  }

  async readPermissions(): Promise<string[]> {
    const query = `
      SELECT
        permission
      FROM
        rolePermissions rp
      JOIN
        userRoles ur
      ON
        rp.roleId = ur.roleId
      WHERE
        ur.userId = ?
      GROUP BY
        permission
    `;
    const values = [this.userId];
    const [rows] = await execQuery(query, values);
    return rows.map((row: Record<string, string>) => row.permission);
  }

  async create(): Promise<void> {
    if (!this.userId) {
      return;
    }
    this.lastToken = generateId();
    await this.touch();
    await this.read();
  }

  async touch(): Promise<void> {
    this.tokenExpires = generateExpiration();
    const query = `
      UPDATE
        users
      SET
        lastToken = ?,
        tokenExpires = ?
      WHERE
        userId = ?
    `;
    const values = [this.lastToken, this.tokenExpires, this.userId];
    await execQuery(query, values);
  }

  async delete(): Promise<void> {
    const query = `
      UPDATE
        users
      SET
        lastToken = ?,
        tokenExpires = ?
      WHERE
        lastToken = ?
    `;
    const values = [null, null, this.lastToken];
    await execQuery(query, values);
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  forClient(): object {
    return JSON.parse(
      JSON.stringify({
        lastToken: this.lastToken,
        tokenExpires: this.tokenExpires,
        userId: this.userId,
        username: this.username,
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName,
        passwordIsExpired: this.passwordIsExpired,
        homePage: this.homePage,
        permissions: this.permissions,
      })
    );
  }
}
