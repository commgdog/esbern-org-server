import Joi from 'joi';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import generateId from '../../util/generate-id.js';
import { execQuery, getConnection } from '../../util/database.js';
import Permission from '../../util/permission.js';

export default class Role {
  roleId: string | null = null;

  name: string | null = null;

  description: string | null = null;

  permissions: Permission[] = [];

  isValid: boolean = false;

  // prettier-ignore
  schema: Joi.ObjectSchema = Joi.object({
    name: Joi
      .string()
      .label('Name')
      .trim()
      .min(2)
      .max(50)
      .required(),
    description: Joi.string()
      .label('Description')
      .trim()
      .min(0)
      .max(150)
      .allow(null)
      .required(),
    permissions: Joi.array()
      .label('Permissions')
      .items(Joi.string().valid(...Object.values(Permission)))
      .required(),
  });

  constructor(properties = {}) {
    Object.assign(this, properties);
  }

  static async readAll() {
    const query = `
      SELECT
        roleId,
        name,
        description
      FROM
        roles
      ORDER BY
        name
    `;
    const [rows] = await execQuery(query);
    return rows;
  }

  async read() {
    const query = `
      SELECT
        *
      FROM
        roles
      WHERE
        roleId = ?
    `;
    const values = [this.roleId];
    const [rows] = await execQuery<RowDataPacket[]>(query, values);
    if (rows.length === 1) {
      Object.assign(this, rows[0]);
      this.permissions = await this.readPermissions();
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
        rolePermissions
      WHERE
        roleId = ?
    `;
    const values = [this.roleId];
    const [rows] = await execQuery<RowDataPacket[]>(query, values);
    return rows.map((row) => row.permission);
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
    if (!(await this.isUnique())) {
      errors.push({ field: 'name', message: '"Name" already in use' });
    }
    return errors;
  }

  async create() {
    this.roleId ??= generateId();
    const conn = await getConnection();
    try {
      await conn.beginTransaction();
      const query = `
        INSERT INTO
          roles (
            roleId,
            name,
            description
          )
        VALUES
          ?
      `;
      const values = [this.roleId, this.name, this.description];
      await conn.query(query, [[values]]);
      await this.setPermissions(conn);
      await conn.commit();
      await this.read();
    } catch (err: unknown) {
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
          roles
        SET
          name = ?,
          description = ?
        WHERE
          roleId = ?
      `;
      const values = [this.name, this.description, this.roleId];
      await conn.query(query, values);
      await this.setPermissions(conn);
      await conn.commit();
      await this.read();
    } catch (err: unknown) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async delete() {
    const query = `
      DELETE FROM
        roles
      WHERE
        roleId = ?
    `;
    const values = [this.roleId];
    await execQuery(query, values);
  }

  async isUnique() {
    let query = `
      SELECT
        1
      FROM
        roles
      WHERE
        name = ?
    `;
    const values = [this.name];
    if (this.roleId) {
      query += ' AND roleId <> ?';
      values.push(this.roleId);
    }
    const [rows] = await execQuery<RowDataPacket[]>(query, values);
    return !rows.length;
  }

  async validatePermissions() {
    return this.permissions.every((value) =>
      Object.values(Permission).includes(value)
    );
  }

  async deletePermissions(conn: PoolConnection) {
    const query = `
      DELETE FROM
        rolePermissions
      WHERE
        roleId = ?
    `;
    const values = [this.roleId];
    await conn.query(query, values);
  }

  async insertPermissions(conn: PoolConnection) {
    const query = `
      INSERT INTO
        rolePermissions (
          roleId,
          permission
        )
      VALUES
        ?
    `;
    const values = [
      this.permissions.map((permission) => [this.roleId, permission]),
    ];
    await conn.query(query, values);
  }

  async setPermissions(conn: PoolConnection) {
    if (await this.validatePermissions()) {
      await this.deletePermissions(conn);
      if (this.permissions.length) {
        await this.insertPermissions(conn);
      }
    }
  }

  forClient() {
    return JSON.parse(
      JSON.stringify({
        roleId: this.roleId,
        name: this.name,
        description: this.description,
        permissions: this.permissions,
      })
    );
  }
}
