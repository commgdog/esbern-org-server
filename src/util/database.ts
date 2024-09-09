import mysql, { RowDataPacket } from 'mysql2';

const database = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASS || 'pass',
  database: process.env.DB_NAME || 'omni',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true,
});

const pool = database.promise();

export const execQuery = async (query: string, values: unknown = []) => {
  const conn = await pool.getConnection();
  const response = await conn.query<RowDataPacket[]>(query, values);
  conn.release();
  return response;
};

export default pool;
