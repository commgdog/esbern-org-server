import { RowDataPacket } from 'mysql2/promise';
import { uuidv7 } from 'uuidv7';
import { execQuery } from '../../services/database.js';
import datetime from '../../services/datetime.js';
const SESSION_TIMEOUT_LENGTH = 900;

export const generateExpiration = () => datetime()
  .add(SESSION_TIMEOUT_LENGTH, 'second')
  .format('YYYY-MM-DD HH:mm:ss');

export default class Session {
  lastToken: string | null = null;

  tokenExpires: string | null = null;

  userId: string | null = null;

  username: string | null = null;

  email: string | null = null;

  firstName: string | null = null;

  lastName: string | null = null;

  passwordIsExpired: boolean = false;

  timezone: string = 'UTC';

  theme: string = 'light';

  homePage: string = 'dashboard';

  permissions: string[] = [];

  availableRoles: Record<string, string>[] = [];

  announcements: object[] = [];

  isValid: boolean = false;

  constructor(properties = {}) {
    Object.assign(this, properties);
  }

  async read(touch = true) {
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
        timezone,
        theme,
        homePage
      FROM
        users
      WHERE
        isInactive = 0
      AND
        lastToken = ?
      AND
        tokenExpires > ?
    `;
    const values = [
      this.lastToken,
      datetime().format('YYYY-MM-DD HH:mm:ss'),
    ];
    const [rows] = await execQuery<RowDataPacket[]>(query, values);
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
      this.availableRoles = await this.readAvailableRoles();
      this.announcements = await this.readAnnouncements();
      this.isValid = true;
      return true;
    }
    this.isValid = false;
    return false;
  }

  async readPermissions() {
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
    const [rows] = await execQuery<RowDataPacket[]>(query, values);
    return rows.map((row) => row.permission);
  }

  async readAvailableRoles() {
    const query = `
      SELECT
        roleId,
        name
      FROM
        roles
    `;
    const [rows] = await execQuery<RowDataPacket[]>(query);
    return rows.map((row) => ({ value: row.roleId, title: row.name }));
  }

  async readAnnouncements() {
    const query = `
      SELECT
        a.announcementId,
        announceAt,
        title,
        body,
        (
          SELECT
            1
          FROM
            announcementsRead ar
          WHERE
            ar.userId = ?
          AND
            ar.announcementId = a.announcementId
        ) AS isRead
      FROM
        announcements a
      WHERE
        expiresAt >= ?
      AND
        announceAt <= ?
    `;
    const currentTimestamp = datetime().format('YYYY-MM-DD HH:mm:ss');
    const values = [
      this.userId,
      currentTimestamp,
      currentTimestamp,
    ];
    const [rows] = await execQuery<RowDataPacket[]>(query, values);
    return rows.map((row) => {
      row.isRead = !!row.isRead;
      return row;
    });
  }

  async create() {
    if (!this.userId) {
      return;
    }
    this.lastToken = uuidv7();
    await this.touch();
    await this.read();
  }

  async touch() {
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
    const values = [
      this.lastToken,
      this.tokenExpires,
      this.userId,
    ];
    await execQuery(query, values);
  }

  async delete() {
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

  hasPermission(permission: string) {
    return this.permissions.includes(permission);
  }

  forClient() {
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
        timezone: this.timezone,
        theme: this.theme,
        homePage: this.homePage,
        permissions: this.permissions,
        availableRoles: this.availableRoles,
        announcements: this.announcements,
      }),
    );
  }
}
