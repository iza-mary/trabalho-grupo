const mysql = require('mysql2/promise');

const dbconfig = {
    host: 'localhost',
    user: 'root',
    password: 'admin123',
    database: 'sistema_idosos',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbconfig);

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Conectado ao MySQL com sucesso!');
        connection.release();
    } catch (error) {
        console.error('Erro ao conectar ao MySQL:', error.message);
    }
};

testConnection();

module.exports = pool;