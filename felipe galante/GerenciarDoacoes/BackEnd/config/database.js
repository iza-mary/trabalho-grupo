const sql = require('mysql2/promise');
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'admin123',
    database: 'sistema_idosos',
    waitForConnections : true,
    connectionLimit : 10,
    queueLimit : 0
}

const pool = sql.createPool(dbConfig);

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Conectado com sucesso!")
        connection.release();
    } catch (error) {
        console.error("Erro ao se conectar!" + error.message);
    }
}

testConnection();
module.exports = pool;