const mysql = require('mysql2/promise'); 

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'mysql123654',
  database: 'quartos_db'
};

const pool = mysql.createPool(dbConfig);

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conectado com sucesso!');
    connection.release();
  } catch (error) {
    console.error('Erro ao conectar ao mysql:', error);
  }
};

testConnection();

module.exports = pool;
