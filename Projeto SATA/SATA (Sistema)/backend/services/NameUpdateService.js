const db = require('../config/database');
const audit = require('../utils/auditLogger');

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function processChunk(tipo, updates) {
  const conn = await db.getConnection();
  const start = Date.now();
  const result = { tipo, processed: 0, changed: 0, notFound: 0, errors: [] };
  try {
    await conn.beginTransaction();
    for (const u of updates) {
      const id = Number(u.id);
      const nome = (u.nome || '').trim();
      if (!id || !nome) {
        result.errors.push({ id: u.id, error: 'ID ou nome inválido' });
        continue;
      }
      try {
        let sql, params;
        if (tipo === 'doadores') {
          sql = 'UPDATE doadores SET nome = ? WHERE id = ?';
          params = [nome, id];
        } else if (tipo === 'produtos') {
          sql = 'UPDATE produtos SET nome = ?, data_atualizacao = NOW() WHERE id = ?';
          params = [nome, id];
        } else {
          result.errors.push({ id, error: `Tipo inválido: ${tipo}` });
          continue;
        }
        const [res] = await conn.execute(sql, params);
        result.processed += 1;
        if (res.affectedRows > 0) {
          result.changed += 1;
        } else {
          result.notFound += 1;
        }
      } catch (e) {
        result.errors.push({ id, error: e.message });
      }
    }
    await conn.commit();
    const ms = Date.now() - start;
    audit.log('batch_name_update_chunk', { tipo, processed: result.processed, changed: result.changed, notFound: result.notFound, errors: result.errors.length, duration_ms: ms });
    conn.release();
    return result;
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    conn.release();
    throw err;
  }
}

async function batchUpdate({ tipo, updates, chunkSize = 200, concurrency = 3 }) {
  const normalizedTipo = (tipo || '').toLowerCase();
  if (!['doadores', 'produtos'].includes(normalizedTipo)) {
    throw new Error('Tipo deve ser "doadores" ou "produtos"');
  }
  const list = Array.isArray(updates) ? updates : [];
  if (list.length === 0) {
    return { tipo: normalizedTipo, processed: 0, changed: 0, notFound: 0, errors: [], duration_ms: 0, chunks: [] };
  }
  const chunks = chunkArray(list, Math.max(1, Number(chunkSize)));
  const start = Date.now();
  const results = [];
  let idx = 0;
  async function runNext() {
    if (idx >= chunks.length) return null;
    const i = idx++;
    return processChunk(normalizedTipo, chunks[i]);
  }
  const runners = Array.from({ length: Math.max(1, Number(concurrency)) }, async () => {
    const runnerResults = [];
    while (true) {
      const r = await runNext();
      if (!r) break;
      runnerResults.push(r);
    }
    return runnerResults;
  });
  const parallel = await Promise.all(runners);
  parallel.forEach(group => group.forEach(r => results.push(r)));
  const total = results.reduce((acc, r) => {
    acc.processed += r.processed;
    acc.changed += r.changed;
    acc.notFound += r.notFound;
    acc.errors += r.errors.length;
    return acc;
  }, { processed: 0, changed: 0, notFound: 0, errors: 0 });
  const ms = Date.now() - start;
  audit.log('batch_name_update_total', { tipo: normalizedTipo, processed: total.processed, changed: total.changed, notFound: total.notFound, errors: total.errors, chunks: chunks.length, duration_ms: ms });
  return { tipo: normalizedTipo, ...total, duration_ms: ms, chunks: results };
}

module.exports = { batchUpdate };