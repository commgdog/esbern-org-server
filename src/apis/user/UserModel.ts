import bcryptjs from 'bcryptjs';
import Joi from 'joi';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import dayjs from 'dayjs';
import { uuidv7 } from 'uuidv7';
import { execQuery, getConnection } from '../../services/database.js';

const { compareSync, hashSync } = bcryptjs;

export const PASSWORD_SALT_ROUNDS: number = 12;
export const PASSWORD_MIN_LENGTH: number = 5;
export const MAX_LOGIN_ATTEMPTS: number = 5;
export const LOGIN_TIMEOUT_LENGTH: number = 900;

export default class User {
  userId: string | null = null;

  username: string | null = null;

  email: string | null = null;

  password: string | null = null;

  passwordIsExpired: boolean = false;

  firstName: string | null = null;

  lastName: string | null = null;

  theme: string | null = 'light';

  homePage: string | null = 'dashboard';

  hasActiveSession: boolean = false;

  lastToken: string | null = null;

  tokenExpires: string | null = null;

  loginAttemptCount: number = 0;

  lastLoginAttemptAt: string | null = null;

  lifetimeLoginCount: number = 0;

  isInactive: boolean = false;

  roles: (string | null)[] = [];

  schema: Joi.ObjectSchema = Joi.object({
    username: Joi
      .string()
      .label('Username')
      .alphanum()
      .trim()
      .min(2)
      .max(255)
      .required(),
    email: Joi
      .string()
      .label('Email')
      .email()
      .trim()
      .required(),
    password: Joi
      .string()
      .label('Password')
      .allow(null)
      .allow('')
      .min(PASSWORD_MIN_LENGTH)
      .required(),
    passwordConfirm: Joi
      .string()
      .label('Password Confirmation')
      .allow(null)
      .allow('')
      .min(PASSWORD_MIN_LENGTH)
      .required(),
    passwordIsExpired: Joi
      .boolean()
      .label('Password is expired')
      .required(),
    firstName: Joi
      .string()
      .label('First Name')
      .trim()
      .min(1)
      .max(50)
      .required(),
    lastName: Joi
      .string()
      .label('Last Name')
      .trim()
      .min(1)
      .max(50)
      .required(),
    theme: Joi
      .string()
      .label('Theme')
      .trim()
      .min(1)
      .max(255)
      .required(),
    homePage: Joi
      .string()
      .label('Home Page')
      .trim()
      .min(1)
      .max(255)
      .required(),
    isInactive: Joi
      .boolean()
      .label('Inactive')
      .required(),
    roles: Joi.array()
      .label('Roles')
      .items(
        Joi.string().guid({
          version: ['uuidv7'],
        }),
      )
      .required(),
  });

  constructor(properties = {}) {
    Object.assign(this, properties);
  }

  static async readAll() {
    const query = `
      SELECT
        userId,
        username,
        email,
        firstName,
        lastName,
        IF(tokenExpires AND tokenExpires > NOW(), 1, 0) AS hasActiveSession,
        isInactive
      FROM
        users
      ORDER BY
        firstName
    `;
    const [rows] = await execQuery<RowDataPacket[]>(query);
    return rows.map((row) => {
      row.hasActiveSession = !!row.hasActiveSession;
      row.isInactive = !!row.isInactive;
      return row;
    });
  }

  async read(readByUsername: boolean = false) {
    const query = `
      SELECT
        *
      FROM
        users
      WHERE
        ${readByUsername ? 'username' : 'userId'} = ?
    `;
    const values = [readByUsername ? this.username : this.userId];
    const [rows] = await execQuery<RowDataPacket[]>(query, values);
    if (rows.length === 1) {
      rows[0].passwordIsExpired = !!rows[0].passwordIsExpired;
      rows[0].hasActiveSession = !!rows[0].hasActiveSession;
      rows[0].isInactive = !!rows[0].isInactive;
      Object.assign(this, rows[0]);
      this.roles = await this.readRoles();
      return true;
    }
    return false;
  }

  async readRoles() {
    const query = `
      SELECT
        roleId
      FROM
        userRoles
      WHERE
        userId = ?
    `;
    const values = [this.userId];
    const [rows] = await execQuery<RowDataPacket[]>(query, values);
    return rows.map((row) => row.roleId);
  }

  async validate(values: object) {
    const errors: object[] = [];
    const { error, value } = this.schema.validate(values, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      error.details.forEach((err: Joi.ValidationErrorItem) => {
        errors.push({ field: err.context?.key, message: err.message });
      });
    } else {
      if (!this.userId && !value.password) {
        errors.push({
          field: 'password',
          message: 'Missing password',
        });
      } else if (value.password && value.password.length < PASSWORD_MIN_LENGTH) {
        errors.push({
          field: 'password',
          message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        });
      } else if (value.password !== value.passwordConfirm) {
        errors.push({
          field: 'passwordConfirm',
          message: 'Passwords do not match',
        });
      } else if (value.password) {
        this.setPassword(value.password);
      }
      delete value.password;
      Object.assign(this, value);
    }
    if (!(await this.isUnique())) {
      errors.push({
        field: 'username',
        message: '"Username" already in use',
      });
    }
    return errors;
  }

  async markAnnouncementAsRead(announcementId: string | null) {
    const query = `
      INSERT IGNORE INTO
        announcementsRead (
          announcementId,
          userId
        )
      VALUES
        ?
    `;
    const values = [
      announcementId,
      this.userId,
    ];
    await execQuery(query, [[values]]);
  }

  async create() {
    this.userId ??= uuidv7();
    const conn = await getConnection();
    try {
      await conn.beginTransaction();
      const query = `
        INSERT INTO
          users (
            userId,
            username,
            email,
            password,
            passwordIsExpired,
            firstName,
            lastName,
            theme,
            homePage,
            lastToken,
            tokenExpires,
            loginAttemptCount,
            lastLoginAttemptAt,
            lifetimeLoginCount,
            isInactive
          )
        VALUES
          ?
      `;
      const values = [
        this.userId,
        this.username,
        this.email,
        this.password,
        this.passwordIsExpired,
        this.firstName,
        this.lastName,
        this.theme,
        this.homePage,
        this.lastToken,
        this.tokenExpires,
        this.loginAttemptCount,
        this.lastLoginAttemptAt,
        this.lifetimeLoginCount,
        this.isInactive,
      ];
      await conn.query(query, [[values]]);
      await this.setRoles(conn);
      await conn.commit();
      await this.read();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async update() {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();
      const query = `
        UPDATE
          users
        SET
          username = ?,
          email = ?,
          password = ?,
          passwordIsExpired = ?,
          firstName = ?,
          lastName = ?,
          theme = ?,
          homePage = ?,
          lastToken = ?,
          tokenExpires = ?,
          loginAttemptCount = ?,
          lastLoginAttemptAt = ?,
          lifetimeLoginCount = ?,
          isInactive = ?
        WHERE
          userId = ?
      `;
      const values = [
        this.username,
        this.email,
        this.password,
        this.passwordIsExpired,
        this.firstName,
        this.lastName,
        this.theme,
        this.homePage,
        this.lastToken,
        this.tokenExpires,
        this.loginAttemptCount,
        this.lastLoginAttemptAt,
        this.lifetimeLoginCount,
        this.isInactive,
        this.userId,
      ];
      await conn.query(query, values);
      await this.setRoles(conn);
      await conn.commit();
      await this.read();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async delete() {
    const query = `
      DELETE FROM
        users
      WHERE
        userId = ?
    `;
    const values = [this.userId];
    await execQuery(query, values);
  }

  async isUnique() {
    let query = `
      SELECT
        1
      FROM
        users
      WHERE
        username = ?
    `;
    const values = [this.username];
    if (this.userId) {
      query += ' AND userId <> ?';
      values.push(this.userId);
    }
    const [rows] = await execQuery<RowDataPacket[]>(query, values);
    return !rows.length;
  }

  async validateRoles() {
    const query = `
      SELECT
        roleId
      FROM
        roles
    `;
    const [rows] = await execQuery<RowDataPacket[]>(query);
    return this.roles.every((value) =>
      rows.map((row) => row.roleId).includes(value),
    );
  }

  async deleteRoles(conn: PoolConnection) {
    const query = `
      DELETE FROM
        userRoles
      WHERE
        userId = ?
    `;
    const values = [this.userId];
    await conn.query(query, values);
  }

  async insertRoles(conn: PoolConnection) {
    const query = `
      INSERT INTO
        userRoles (
          userId,
          roleId
        )
      VALUES
        ?
    `;
    const values = [this.roles.map((roleId) => [this.userId, roleId])];
    await conn.query(query, values);
  }

  async setRoles(conn: PoolConnection) {
    if (await this.validateRoles()) {
      await this.deleteRoles(conn);
      if (this.roles.length) {
        await this.insertRoles(conn);
      }
    }
  }

  async readRoleNames() {
    const query = `
      SELECT
        name
      FROM
        userRoles u
      LEFT JOIN
        roles r
      ON
        u.roleId = r.roleId
      WHERE
        userId = ?
    `;
    const values = [this.userId];
    const [rows] = await execQuery<RowDataPacket[]>(query, values);
    return rows.map((row: Record<string, string>) => row.name);
  }

  setPassword(password: string) {
    this.password = hashSync(password, PASSWORD_SALT_ROUNDS);
  }

  verifyPassword(password: string) {
    if (!this.password) {
      return false;
    }
    return compareSync(password, this.password);
  }

  isLockedOut() {
    if (!this.lastLoginAttemptAt) {
      return false;
    }
    const duration = dayjs().diff(this.lastLoginAttemptAt, 'second');
    return (
      this.loginAttemptCount >= MAX_LOGIN_ATTEMPTS
      && duration < LOGIN_TIMEOUT_LENGTH
    );
  }

  forClient() {
    return {
      userId: this.userId,
      username: this.username,
      email: this.email,
      passwordIsExpired: this.passwordIsExpired,
      firstName: this.firstName,
      lastName: this.lastName,
      theme: this.theme,
      homePage: this.homePage,
      hasActiveSession: this.hasActiveSession,
      tokenExpires: this.tokenExpires,
      lastLoginAttemptAt: this.lastLoginAttemptAt,
      lifetimeLoginCount: this.lifetimeLoginCount,
      isInactive: this.isInactive,
      roles: this.roles,
    };
  }
}
