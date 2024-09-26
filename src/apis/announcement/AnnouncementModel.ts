import Joi from 'joi';
import dayjs from 'dayjs';
import { RowDataPacket } from 'mysql2/promise';
import { execQuery } from '../../services/database.js';
import { uuidv7 } from 'uuidv7';

export default class Announcement {
  announcementId: string | null = null;

  announceAt: string | null = null;

  expiresAt: string | null = null;

  title: string | null = null;

  body: string | null = null;

  schema: Joi.ObjectSchema = Joi.object({
    announceAt: Joi
      .string()
      .trim()
      .label('Announce At')
      .required(),
    expiresAt: Joi
      .string()
      .trim()
      .label('Expires At')
      .required(),
    title: Joi
      .string()
      .label('Title')
      .trim()
      .min(1)
      .max(255)
      .required(),
    body: Joi
      .string()
      .label('Body')
      .trim()
      .min(1)
      .max(1000)
      .required(),
  });

  constructor(properties = {}) {
    Object.assign(this, properties);
  }

  static async readAll() {
    const query = `
      SELECT
        announcementId,
        announceAt,
        expiresAt,
        title
      FROM
        announcements
      ORDER BY
        announceAt DESC
    `;
    const [rows] = await execQuery(query);
    return rows;
  }

  async read() {
    const query = `
      SELECT
        *
      FROM
        announcements
      WHERE
        announcementId = ?
    `;
    const values = [
      this.announcementId,
    ];
    const [rows] = await execQuery<RowDataPacket[]>(query, values);
    if (rows.length === 1) {
      Object.assign(this, rows[0]);
      return true;
    }
    return false;
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
      Object.assign(this, value);
    }
    if (
      this.announceAt
      && this.expiresAt
      && dayjs(this.expiresAt).isBefore(this.announceAt)
    ) {
      errors.push({
        field: 'announceAt',
        message: 'Must announce before expiration',
      });
    }
    if (this.announceAt) {
      this.announceAt = dayjs(this.announceAt).format('YYYY-MM-DD HH:mm:ss');
    }
    if (this.expiresAt) {
      this.expiresAt = dayjs(this.expiresAt).format('YYYY-MM-DD HH:mm:ss');
    }
    return errors;
  }

  async create() {
    this.announcementId ??= uuidv7();
    const query = `
      INSERT INTO
        announcements (
          announcementId,
          announceAt,
          expiresAt,
          title,
          body
        )
      VALUES
        ?
    `;
    const values = [
      this.announcementId,
      this.announceAt,
      this.expiresAt,
      this.title,
      this.body,
    ];
    await execQuery(query, [[values]]);
  }

  async update() {
    const query = `
      UPDATE
        announcements
      SET
        announceAt = ?,
        expiresAt = ?,
        title = ?,
        body = ?
      WHERE
        announcementId = ?
    `;
    const values = [
      this.announceAt,
      this.expiresAt,
      this.title,
      this.body,
      this.announcementId,
    ];
    await execQuery(query, values);
  }

  async delete() {
    const query = `
      DELETE FROM
        announcements
      WHERE
        announcementId = ?
    `;
    const values = [
      this.announcementId,
    ];
    await execQuery(query, values);
  }

  forClient() {
    return JSON.parse(JSON.stringify({
      announcementId: this.announcementId,
      announceAt: this.announceAt,
      expiresAt: this.expiresAt,
      title: this.title,
      body: this.body,
    }));
  }
}
