const sql = require('mssql');
const logger = require('../utils/logger');

// Cau hinh ket noi SQL Server
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

/**
 * Tao ket noi pool den SQL Server
 * @returns {Promise<sql.ConnectionPool>}
 */
const getConnection = async () => {
  try {
    if (pool) {
      return pool;
    }

    pool = await sql.connect(config);
    logger.info('Database connected successfully');

    // Xu ly su kien disconnect
    pool.on('error', (err) => {
      logger.error('Database pool error:', err);
      pool = null;
    });

    return pool;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

/**
 * Dong ket noi database
 */
const closeConnection = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

/**
 * Test ket noi database
 */
const testConnection = async () => {
  try {
    const connection = await getConnection();
    const result = await connection.request().query('SELECT 1 AS test');
    logger.info('Database test query successful');
    return result.recordset[0].test === 1;
  } catch (error) {
    logger.error('Database test failed:', error);
    return false;
  }
};

module.exports = {
  sql,
  getConnection,
  closeConnection,
  testConnection,
};