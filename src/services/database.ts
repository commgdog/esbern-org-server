import mysql, { FieldPacket, Pool } from 'mysql2/promise';

let pool: Pool;

export const initPool = () => {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    dateStrings: true,
  });
};

export const getConnection = () => {
  return pool.getConnection();
};

export const execQuery = async <T>(
  query: string,
  values: unknown = [],
): Promise<[T, FieldPacket[]]> => {
  const conn = await pool.getConnection();
  const response = await conn.query(query, values);
  conn.release();
  return response as [T, FieldPacket[]];
};
