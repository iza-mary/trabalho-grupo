const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { log } = require('../utils/auditLogger');
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
    { table: 'notificacoes', index: 'idx_notificacoes_data', sql: 'CREATE INDEX idx_notificacoes_data ON notificacoes (data_criacao, id)' },
    { table: 'notificacoes', index: 'idx_notificacoes_lida_usuario', sql: 'CREATE INDEX idx_notificacoes_lida_usuario ON notificacoes (lida, usuario_id, data_criacao)' },
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

async function ensureTriggers() {
  const conn = await pool.getConnection();
  const created = [];
  const existing = [];
  const errors = [];
  const tables = [
    'doadores','produtos','financeiro','eventos','idosos','internacoes','quartos','doacoes','movimentos_estoque','observacoes_idosos','users'
  ];
  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function refTipoFor(t) {
    if (t === 'doadores') return 'doador';
    if (t === 'produtos') return 'produto';
    if (t === 'financeiro') return 'financeiro';
    if (t === 'eventos') return 'evento';
    if (t === 'idosos') return 'idoso';
    if (t === 'quartos') return 'quarto';
    if (t === 'doacoes') return 'doacao';
    return null;
  }
  function labelFor(t) {
    if (t === 'doadores') return 'doador';
    if (t === 'produtos') return 'produto';
    if (t === 'financeiro') return 'lançamento financeiro';
    if (t === 'eventos') return 'evento';
    if (t === 'idosos') return 'idoso';
    if (t === 'internacoes') return 'internação';
    if (t === 'quartos') return 'quarto';
    if (t === 'doacoes') return 'doação';
    if (t === 'movimentos_estoque') return 'movimento de estoque';
    if (t === 'observacoes_idosos') return 'observação';
    if (t === 'users') return 'usuário';
    return t;
  }
  function genderFor(t) {
    if (t === 'internacoes') return 'f';
    if (t === 'doacoes') return 'f';
    if (t === 'observacoes_idosos') return 'f';
    return 'm';
  }
  function detailsExpr(t, ref) {
    if (t === 'doadores') return `${ref}.nome`;
    if (t === 'produtos') return `${ref}.nome`;
    if (t === 'financeiro') return `CONCAT(${ref}.descricao, ' (R$ ', FORMAT(${ref}.valor, 2), ')')`;
    if (t === 'eventos') return `CONCAT(${ref}.titulo, ' em ', DATE_FORMAT(${ref}.data_inicio, '%d/%m/%Y'))`;
    if (t === 'idosos') return `${ref}.nome`;
    if (t === 'internacoes') return `CONCAT((SELECT nome FROM idosos WHERE id = ${ref}.idoso_id), ' - quarto ', (SELECT numero FROM quartos WHERE id = ${ref}.quarto_id), ', cama ', ${ref}.cama)`;
    if (t === 'quartos') return `${ref}.numero`;
    if (t === 'doacoes') return `CONCAT(${ref}.tipo, ' - ', (SELECT nome FROM doadores WHERE id = ${ref}.doador))`;
    if (t === 'movimentos_estoque') return `CONCAT((SELECT nome FROM produtos WHERE id = ${ref}.produto_id), ' - ', ${ref}.tipo, ' de ', ${ref}.quantidade)`;
    if (t === 'observacoes_idosos') return `(SELECT nome FROM idosos WHERE id = ${ref}.idoso_id)`;
    if (t === 'users') return `${ref}.username`;
    return `CONCAT('Registro ', ${ref}.id)`;
  }
  function tituloFor(t, event) {
    const l = labelFor(t);
    const g = genderFor(t);
    if (event === 'INSERT') return `CONCAT('${g === 'f' ? 'Nova' : 'Novo'} ${l} ${g === 'f' ? 'criada' : 'criado'}')`;
    if (event === 'UPDATE') return `CONCAT('${capitalize(l)} ${g === 'f' ? 'atualizada' : 'atualizado'}')`;
    return `CONCAT('${capitalize(l)} ${g === 'f' ? 'removida' : 'removido'}')`;
  }
  try {
    for (const t of tables) {
      const allowUpdate = new Set(['doadores','produtos','financeiro','eventos','idosos','quartos','doacoes','users']).has(t);
      const allowDelete = new Set(['doadores','produtos','financeiro','eventos','idosos','quartos','doacoes','users']).has(t);
      const trigDefs = [
        { name: `tr_${t}_after_insert_notify`, timing: 'AFTER', event: 'INSERT', ref: 'NEW' },
        ...(allowUpdate ? [{ name: `tr_${t}_after_update_notify`, timing: 'AFTER', event: 'UPDATE', ref: 'NEW' }] : []),
        ...(allowDelete ? [{ name: `tr_${t}_after_delete_notify`, timing: 'AFTER', event: 'DELETE', ref: 'OLD' }] : []),
      ];
      const toDisable = [
        !allowUpdate ? `tr_${t}_after_update_notify` : null,
        !allowDelete ? `tr_${t}_after_delete_notify` : null,
      ].filter(Boolean);
      for (const trigName of toDisable) {
        try { await conn.query(`DROP TRIGGER IF EXISTS \`${trigName}\``); } catch (_) {}
      }
      for (const td of trigDefs) {
        try {
          const [rows] = await conn.query(
            `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA=? AND TRIGGER_NAME=?`,
            [DB_NAME, td.name]
          );
          const exists = Number(rows?.[0]?.cnt || 0) > 0;
          if (exists) {
            try { await conn.query(`DROP TRIGGER IF EXISTS \`${td.name}\``); existing.push(td.name); } catch (_) {}
          }
          const tituloExpr = tituloFor(t, td.event);
          const descricaoExpr = detailsExpr(t, td.ref);
          const refTipo = refTipoFor(t);
          const refTipoVal = refTipo ? `'${refTipo}'` : 'NULL';
          const dedupSeconds = 30;
          const globalWindowSeconds = 10;
          const sql =
            `CREATE TRIGGER \`${td.name}\` ${td.timing} ${td.event} ON \`${t}\` FOR EACH ROW \n` +
            `BEGIN \n` +
            `  DECLARE v_count INT DEFAULT 0; \n` +
            `  DECLARE v_titulo VARCHAR(200); \n` +
            `  DECLARE v_desc TEXT; \n` +
            `  DECLARE v_recent INT DEFAULT 0; \n` +
            `  SET v_titulo = ${tituloExpr}; \n` +
            `  SET v_desc = ${descricaoExpr}; \n` +
            `  SELECT COUNT(*) INTO v_recent FROM notificacoes \n` +
            `    WHERE TIMESTAMPDIFF(SECOND, data_criacao, NOW()) <= ${globalWindowSeconds}; \n` +
            `  SELECT COUNT(*) INTO v_count FROM notificacoes \n` +
            `    WHERE titulo = v_titulo \n` +
            `      AND referencia_id = ${td.ref}.id \n` +
            `      AND (referencia_tipo <=> ${refTipoVal}) \n` +
            `      AND TIMESTAMPDIFF(SECOND, data_criacao, NOW()) <= ${dedupSeconds}; \n` +
            `  IF v_recent = 0 AND v_count = 0 THEN \n` +
            `    INSERT INTO notificacoes (tipo, titulo, descricao, prioridade, lida, usuario_id, referencia_id, referencia_tipo, data_criacao) \n` +
            `    VALUES ('cadastro', v_titulo, v_desc, 'normal', 0, NULL, ${td.ref}.id, ${refTipoVal}, NOW()); \n` +
            `  END IF; \n` +
            `END`;
          await conn.query(sql);
          created.push(td.name);
        } catch (e) {
          errors.push({ trigger: td.name, error: e.message });
        }
      }
    }
  } finally {
    conn.release();
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

    // Índice único em relação doação-produto (apenas se tabela legada existir)
    const [tblRelRows] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME='doacaoproduto'`,
      [DB_NAME]
    );
    const hasRelTable = Number(tblRelRows?.[0]?.cnt || 0) > 0;
    if (hasRelTable) {
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
    }

    const [estadoCntRows] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM estados`
    );
    const estadosCount = Number(estadoCntRows?.[0]?.cnt || 0);
    if (estadosCount === 0) {
      try {
        const estados = [
          ['Acre','AC'], ['Alagoas','AL'], ['Amapá','AP'], ['Amazonas','AM'], ['Bahia','BA'], ['Ceará','CE'],
          ['Distrito Federal','DF'], ['Espírito Santo','ES'], ['Goiás','GO'], ['Maranhão','MA'], ['Mato Grosso','MT'], ['Mato Grosso do Sul','MS'],
          ['Minas Gerais','MG'], ['Pará','PA'], ['Paraíba','PB'], ['Paraná','PR'], ['Pernambuco','PE'], ['Piauí','PI'],
          ['Rio de Janeiro','RJ'], ['Rio Grande do Norte','RN'], ['Rio Grande do Sul','RS'], ['Rondônia','RO'], ['Roraima','RR'],
          ['Santa Catarina','SC'], ['São Paulo','SP'], ['Sergipe','SE'], ['Tocantins','TO']
        ];
        const values = estados.map(e => `('${e[0]}','${e[1]}')`).join(',');
        await conn.query(`INSERT INTO estados (nome, uf) VALUES ${values}`);
        changes.push('estados.seed');
      } catch (e) {
        errors.push({ action: 'estados.seed', error: e.message });
      }
    }

    // Conversão de tipos de doações: 'D','A','O' -> 'Dinheiro','Alimento','Outros'
    try {
      const [colTypeRows] = await conn.query(
        `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='doacoes' AND COLUMN_NAME='tipo'`,
        [DB_NAME]
      );
      const colType = String(colTypeRows?.[0]?.COLUMN_TYPE || '');
      const isOldEnum = /enum\('D','A','O'\)/i.test(colType);
      const isMixedEnum = /enum\('D','A','O','Dinheiro','Alimento','Outros'\)/i.test(colType);
      const isNewEnum = /enum\('Dinheiro','Alimento','Outros'\)/i.test(colType);

      if (!isNewEnum) {
        if (isOldEnum) {
          await conn.query(`ALTER TABLE doacoes MODIFY COLUMN tipo enum('D','A','O','Dinheiro','Alimento','Outros') NOT NULL`);
        }
        if (isOldEnum || isMixedEnum) {
          await conn.query(`UPDATE doacoes SET tipo='Dinheiro' WHERE tipo='D'`);
          await conn.query(`UPDATE doacoes SET tipo='Alimento' WHERE tipo='A'`);
          await conn.query(`UPDATE doacoes SET tipo='Outros' WHERE tipo='O'`);
          await conn.query(`ALTER TABLE doacoes MODIFY COLUMN tipo enum('Dinheiro','Alimento','Outros') NOT NULL`);
          changes.push('doacoes.tipo_convert_to_words');
        }
      }
    } catch (e) {
      errors.push({ action: 'doacoes.tipo_convert_to_words', error: e.message });
    }

    try {
      const [rows] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA=? AND TRIGGER_NAME='tr_notificacoes_after_insert_cleanup'`,
        [DB_NAME]
      );
      const existsCleanupTrig = Number(rows?.[0]?.cnt || 0) > 0;
      if (existsCleanupTrig) {
        try {
          await conn.query('DROP TRIGGER IF EXISTS `tr_notificacoes_after_insert_cleanup`');
          changes.push('notificacoes.cleanup_trigger_removed');
        } catch (e) {
          errors.push({ action: 'notificacoes.cleanup_trigger_removed', error: e.message });
        }
      }
    } catch (_) {}

    const [userInitColRows] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND COLUMN_NAME='usuario_inicial'`,
      [DB_NAME]
    );
    const hasUsuarioInicial = Number(userInitColRows?.[0]?.cnt || 0) > 0;
    if (!hasUsuarioInicial) {
      try {
        await conn.query(`ALTER TABLE users ADD COLUMN usuario_inicial TINYINT(1) NOT NULL DEFAULT 0`);
        changes.push('users.add_column_usuario_inicial');
      } catch (e) {
        errors.push({ action: 'users.add_column_usuario_inicial', error: e.message });
      }
    }

    let hasStatusCol = false;
    try {
      const [userStatusColRows] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND COLUMN_NAME='status'`,
        [DB_NAME]
      );
      hasStatusCol = Number(userStatusColRows?.[0]?.cnt || 0) > 0;
    } catch (_) {}

    try {
      const [adminRows] = await conn.query(`SELECT id, role${hasStatusCol ? ', status' : ''} FROM users WHERE username = ?`, ['S4TAdmin']);
      if (!Array.isArray(adminRows) || adminRows.length === 0) {
        const password_hash = await bcrypt.hash('S4TApassAcesso', 10);
        let id;
        if (hasStatusCol && hasUsuarioInicial) {
          const [r] = await conn.query(
            'INSERT INTO users (username, email, password_hash, role, status, usuario_inicial) VALUES (?,?,?,?,?,?)',
            ['S4TAdmin', 'admin@sistema.local', password_hash, 'Admin', 'ativo', 1]
          );
          id = r.insertId;
        } else if (hasUsuarioInicial) {
          const [r] = await conn.query(
            'INSERT INTO users (username, email, password_hash, role, usuario_inicial) VALUES (?,?,?,?,?)',
            ['S4TAdmin', 'admin@sistema.local', password_hash, 'Admin', 1]
          );
          id = r.insertId;
        } else if (hasStatusCol) {
          const [r] = await conn.query(
            'INSERT INTO users (username, email, password_hash, role, status) VALUES (?,?,?,?,?)',
            ['S4TAdmin', 'admin@sistema.local', password_hash, 'Admin', 'ativo']
          );
          id = r.insertId;
        } else {
          const [r] = await conn.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)',
            ['S4TAdmin', 'admin@sistema.local', password_hash, 'Admin']
          );
          id = r.insertId;
        }
        if (hasStatusCol) {
          try { await conn.query('UPDATE users SET status = "ativo" WHERE id = ?', [id]); } catch {}
        }
        if (hasUsuarioInicial) {
          try { await conn.query('UPDATE users SET usuario_inicial = 1 WHERE id = ?', [id]); } catch {}
        }
        try { log('user.create', { id, username: 'S4TAdmin', email: 'admin@sistema.local', role: 'Admin', actor: 'system' }); } catch {}
        changes.push('users.seed_admin');
      } else {
        const u = adminRows[0];
        let updated = false;
        if (String(u.role) !== 'Admin') {
          try { await conn.query('UPDATE users SET role = "Admin" WHERE id = ?', [u.id]); updated = true; } catch {}
        }
        if (hasStatusCol) {
          const s = u.status;
          if (!s || s !== 'ativo') {
            try { await conn.query('UPDATE users SET status = "ativo" WHERE id = ?', [u.id]); updated = true; } catch {}
          }
        }
        if (hasUsuarioInicial) {
          try {
            const [fRows] = await conn.query('SELECT usuario_inicial FROM users WHERE id = ?', [u.id]);
            const flag = Array.isArray(fRows) && fRows.length ? Number(fRows[0].usuario_inicial || 0) : 0;
            if (!flag) { try { await conn.query('UPDATE users SET usuario_inicial = 1 WHERE id = ?', [u.id]); updated = true; } catch {} }
          } catch {}
        }
        if (updated) { changes.push('users.admin_promote_update'); }
      }
    } catch (e) {
      errors.push({ action: 'users.seed_admin', error: e.message });
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
    // Migrações desativadas: esquema atual é definido por Tabelas.sql
    const integrityStatus = await ensureIntegrity();
    if (integrityStatus.changes.length) {
      console.log('Integridade aplicada:', integrityStatus.changes.join(', '));
    }
    if (integrityStatus.errors.length) {
      console.error('Erros de integridade:', integrityStatus.errors.map(e => `${e.action}: ${e.error}`).join(' | '));
    }
    const trigStatus = await ensureTriggers();
    if (trigStatus.created.length) {
      console.log('Triggers criadas:', trigStatus.created.join(', '));
    }
    if (trigStatus.errors.length) {
      console.error('Erros ao criar triggers:', trigStatus.errors.map(e => `${e.trigger}: ${e.error}`).join(' | '));
    }
    return schemaStatus;
  } catch (e) {
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
/*
  Configuração de Banco de Dados
  - Inicializa conexão (MySQL/PostgreSQL/MSSQL) conforme variáveis de ambiente.
  - Expõe métodos utilitários como `testConnection` para verificação.
*/

// Migrações removidas
