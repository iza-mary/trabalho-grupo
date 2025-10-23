const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const SQL_SCHEMA_FILE = 'd:\\coisas da facudade\\Progrmação Fullstack I\\trabalho-grupo-1\\Projeto SATA\\Tabelas.sql';
const DB_NAME = process.env.DB_NAME || 'sistema_idosos';

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

function parseCreateTables(sql) {
  const blocks = [];
  const re = /CREATE\s+TABLE\s+`?(\w+)`?\s*\(([\s\S]*?)\)\s*ENGINE[\s\S]*?;/gi;
  let m;
  while ((m = re.exec(sql))) {
    const name = m[1];
    const raw = m[0];
    const createStmt = raw.replace(/CREATE\s+TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS ');
    blocks.push({ name, create: createStmt });
  }
  return blocks;
}

async function ensureSchema() {
  const status = { success: true, existing: [], created: [], errors: [] };
  let sqlText;
  try {
    sqlText = fs.readFileSync(SQL_SCHEMA_FILE, 'utf8');
  } catch (e) {
    status.success = false;
    status.errors.push({ table: null, error: `Falha ao ler arquivo SQL: ${e.message}` });
    return status;
  }
  const blocks = parseCreateTables(sqlText);
  const conn = await pool.getConnection();
  const createdThisRun = [];
  try {
    for (const b of blocks) {
      try {
        const [r] = await conn.query(
          'SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',
          [DB_NAME, b.name]
        );
        const exists = Array.isArray(r) ? r.length > 0 : false;
        if (exists) {
          status.existing.push(b.name);
          continue;
        }
        await conn.query(b.create);
        status.created.push(b.name);
        createdThisRun.push(b.name);
      } catch (err) {
        status.success = false;
        status.errors.push({ table: b.name, error: err.message });
        // rollback manual: remover tabelas criadas nesta execução
        for (let i = createdThisRun.length - 1; i >= 0; i--) {
          const t = createdThisRun[i];
          try {
            await conn.query(`DROP TABLE IF EXISTS \`${t}\``);
          } catch (_) {}
        }
        break; // interrompe processamento após falha
      }
    }
  } finally {
    conn.release();
  }
  return status;
}

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1');
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    const schemaStatus = await ensureSchema();
    if (schemaStatus.success) {
      console.log('Validação de esquema: sucesso');
    } else {
      console.error('Validação de esquema: falhou');
    }
    if (schemaStatus.existing.length) {
      console.log('Tabelas existentes:', schemaStatus.existing.join(', '));
    }
    if (schemaStatus.created.length) {
      console.log('Tabelas criadas:', schemaStatus.created.join(', '));
    }
    if (schemaStatus.errors.length) {
      console.error('Erros:', schemaStatus.errors.map(e => `${e.table || 'arquivo'}: ${e.error}`).join(' | '));
    }
    return schemaStatus;
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
  ensureSchema,
};