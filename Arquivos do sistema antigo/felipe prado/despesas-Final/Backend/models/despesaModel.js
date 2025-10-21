const pool = require('../config/db');

exports.getAll = async () => {
  const [rows] = await pool.query('SELECT * FROM despesas');
  return rows;
};

exports.getById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM despesas WHERE id = ?', [id]);
  return rows[0];
};

exports.create = async ({ descricao, valor, tipo, data, observacao }) => {
  const [result] = await pool.query(
    'INSERT INTO despesas (descricao, valor, tipo, data, observacao) VALUES (?, ?, ?, ?, ?)',
    [descricao, valor, tipo, data, observacao || null]
  );
  return { id: result.insertId, descricao, valor, tipo, data, observacao };
};

exports.update = async (id, { descricao, valor, tipo, data, observacao }) => {
  await pool.query(
    'UPDATE despesas SET descricao = ?, valor = ?, tipo = ?, data = ?, observacao = ? WHERE id = ?',
    [descricao, valor, tipo, data, observacao || null, id]
  );
};

exports.remove = async (id) => {
  await pool.query('DELETE FROM despesas WHERE id = ?', [id]);
};
