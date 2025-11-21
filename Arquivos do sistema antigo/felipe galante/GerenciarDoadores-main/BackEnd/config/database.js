const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'admin123',
    database: 'sata',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}

const pool = mysql.createPool(dbConfig);

const testConnection = async ()=> {
    try {
        const connection = await pool.getConnection();
        console.log("Conectado com Sucesso!")
        connection.release()
    } catch (error) {
        console.error("Erro ao se conectar com o banco de dados!", error.message);
    }
}

testConnection();
module.exports = pool;