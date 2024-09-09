import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';

function rand(length: number): string {
  return crypto.randomBytes(length).toString('hex');
}

const mockDatabase = async (prefix: string) => {
  const name = `test_${prefix}_${rand(12)}`;
  const sql = fs.readFileSync(
    path.resolve(import.meta.dirname + '/../src/sql/create-tables.sql'),
    'utf-8'
  );
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASS || 'pass',
    multipleStatements: true,
  });
  await connection.query(`DROP DATABASE IF EXISTS ${name}`);
  await connection.query(`CREATE DATABASE ${name}`);
  await connection.query(`USE ${name}`);
  await connection.query(sql);
  process.env.DB_NAME = name;
  await connection.end();
  return name;
};

export { mockDatabase };
