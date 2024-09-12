import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { uuidv7 } from 'uuidv7';
import mysql from 'mysql2/promise';
import User from '../src/apis/user/UserModel.js';
import Role, { Permission } from '../src/apis/role/RoleModel.js';
import { generateExpiration } from '../src/apis/session/SessionModel.js';

function rand(length: number) {
  return crypto.randomBytes(length).toString('hex');
}

const createConnection = async () => {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    multipleStatements: true,
  });
};

export const mockDatabase = async (prefix: string) => {
  const name = `_test__${prefix}_${rand(12)}`;
  const sql = fs.readFileSync(
    path.resolve(import.meta.dirname + '/../src/sql/create-tables.sql'),
    'utf-8'
  );
  const connection = await createConnection();
  await connection.query(`DROP DATABASE IF EXISTS ${name}`);
  await connection.query(`CREATE DATABASE ${name}`);
  await connection.query(`USE ${name}`);
  await connection.query(sql);
  process.env.DB_NAME = name;
  await connection.end();
  return name;
};

export const resetDatabase = async (name: string) => {
  const connection = await createConnection();
  await connection.query(`DROP DATABASE IF EXISTS ${name}`);
  await connection.end();
};

export const mockSession = async () => {
  const role = mockRole();
  await role.create();
  const user = mockUser();
  user.lastToken = uuidv7();
  user.tokenExpires = generateExpiration();
  user.roles = [role.roleId];
  await user.create();
  return { role, user };
};

export const mockUser = (username?: string) => {
  const user = new User({
    username: username ?? rand(20),
    email: 'commgdog@gmail.com',
    firstName: rand(20),
    lastName: rand(20),
  });
  user.setPassword('password');
  return user;
};

export const mockRole = (name?: string) => {
  return new Role({
    name: name ?? rand(20),
    description: rand(20),
    permissions: Object.values(Permission),
  });
};
