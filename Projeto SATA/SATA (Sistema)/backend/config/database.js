const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const DB_NAME = process.env.DB_NAME || 'sistema_idosos';
const SQL_SCHEMA_FILE = path.resolve(__dirname, 'Tabelas.sql');

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
  status.tablesDefined = blocks.map(b => b.name);
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

async function ensureIndexes() {
  const checks = [
    { table: 'doadores', index: 'idx_doadores_nome', sql: 'CREATE INDEX idx_doadores_nome ON doadores (nome)' },
    { table: 'produtos', index: 'idx_produtos_nome', sql: 'CREATE INDEX idx_produtos_nome ON produtos (nome)' },
  ];
  const created = [];
  const existing = [];
  const errors = [];
  for (const c of checks) {
    try {
      const [rows] = await pool.query(
        'SELECT COUNT(1) as cnt FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?',
        [DB_NAME, c.table, c.index]
      );
      const exists = Number(rows?.[0]?.cnt || 0) > 0;
      if (exists) {
        existing.push(`${c.table}.${c.index}`);
        continue;
      }
      await pool.query(c.sql);
      created.push(`${c.table}.${c.index}`);
    } catch (error) {
      errors.push({ index: `${c.table}.${c.index}`, error: error.message });
    }
  }
  return { success: errors.length === 0, created, existing, errors };
}

// Garante integridade adicional: coluna gerada para nome normalizado e índices únicos
async function ensureIntegrity() {
  const conn = await pool.getConnection();
  const changes = [];
  const errors = [];
  try {
    // Verificar/ criar coluna gerada nome_norm em produtos
    const [colRows] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='produtos' AND COLUMN_NAME='nome_norm'`,
      [DB_NAME]
    );
    const hasNomeNorm = Number(colRows?.[0]?.cnt || 0) > 0;
    if (!hasNomeNorm) {
      try {
        await conn.query(`ALTER TABLE produtos ADD COLUMN nome_norm varchar(255) GENERATED ALWAYS AS (LOWER(TRIM(nome))) STORED`);
        changes.push('produtos.add_column_nome_norm');
      } catch (e) {
        errors.push({ action: 'produtos.add_column_nome_norm', error: e.message });
      }
    }

    // Índice único em nome_norm para evitar duplicidade por caixa/espaço
    const [idxRows] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME='produtos' AND INDEX_NAME='uk_produtos_nome_norm'`,
      [DB_NAME]
    );
    const hasUkNomeNorm = Number(idxRows?.[0]?.cnt || 0) > 0;
    if (!hasUkNomeNorm) {
      try {
        await conn.query(`CREATE UNIQUE INDEX uk_produtos_nome_norm ON produtos (nome_norm)`);
        changes.push('produtos.uk_nome_norm');
      } catch (e) {
        errors.push({ action: 'produtos.uk_nome_norm', error: e.message });
      }
    }

    // Índice único em relação doação-produto para evitar duplicatas na mesma doação
    const [ukRelRows] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME='doacaoproduto' AND INDEX_NAME='uk_doacaoproduto_doacao_produto'`,
      [DB_NAME]
    );
    const hasUkRel = Number(ukRelRows?.[0]?.cnt || 0) > 0;
    if (!hasUkRel) {
      try {
        await conn.query(`CREATE UNIQUE INDEX uk_doacaoproduto_doacao_produto ON doacaoproduto (doacao_id, produto_id)`);
        changes.push('doacaoproduto.uk_doacao_produto');
      } catch (e) {
        errors.push({ action: 'doacaoproduto.uk_doacao_produto', error: e.message });
      }
    }
  } finally {
    conn.release();
  }
  return { success: errors.length === 0, changes, errors };
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
    
    const ts = new Date().toISOString();
    if (schemaStatus.success && schemaStatus.errors.length === 0) {
      console.log(`[${ts}] VERIFICAÇÃO DE BANCO DE DADOS: Todas as ${schemaStatus.tablesDefined.length} tabelas no banco ${DB_NAME} estão presentes e configuradas corretamente. Tabelas verificadas: [${schemaStatus.tablesDefined.join(', ')}]`);
    }
    const idxStatus = await ensureIndexes();
    if (idxStatus.created.length) {
      console.log('Índices criados:', idxStatus.created.join(', '));
    }
    // Suprimido: não registrar índices já existentes em logs de inicialização
    if (idxStatus.errors.length) {
      console.error('Erros ao criar índices:', idxStatus.errors.map(e => `${e.index}: ${e.error}`).join(' | '));
    }
    const integrityStatus = await ensureIntegrity();
    if (integrityStatus.changes.length) {
      console.log('Integridade aplicada:', integrityStatus.changes.join(', '));
    }
    if (integrityStatus.errors.length) {
      console.error('Erros de integridade:', integrityStatus.errors.map(e => `${e.action}: ${e.error}`).join(' | '));
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
  ensureIndexes,
  ensureIntegrity,
};