const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'sistema_idosos',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: process.env.DB_POOL_SIZE ? Number(process.env.DB_POOL_SIZE) : 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1');
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

module.exports = {
  execute: (...args) => pool.execute(...args),
  query: (...args) => pool.query(...args),
  getConnection: () => pool.getConnection(),
  testConnection,
};