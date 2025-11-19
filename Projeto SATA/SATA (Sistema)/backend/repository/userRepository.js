const db = require('../config/database');

const UserRepository = {
  async findAll({ status, role, page = 1, pageSize = 10, search } = {}) {
    const where = [];
    const params = [];
    if (status && ['ativo','inativo'].includes(String(status))) { where.push('status = ?'); params.push(status); }
    if (role && ['Admin','Funcionário','user'].includes(String(role))) { where.push('role = ?'); params.push(role); }
    if (search) { where.push('(username LIKE ? OR email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.max(1, Number(pageSize));
    const offset = Math.max(0, (Number(page) - 1) * limit);
    const [rows] = await db.execute(`SELECT * FROM users ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    const [countRows] = await db.execute(`SELECT COUNT(*) AS total FROM users ${whereSql}`, params);
    const total = (Array.isArray(countRows) && countRows.length) ? Number(countRows[0].total) : 0;
    const items = (rows || []).map(r => ({
      id: r.id,
      username: r.username,
      email: r.email,
      role: r.role,
      status: r.status || 'ativo',
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
    return { items, total, page: Number(page), pageSize: limit };
  },
  async findByUsername(username) {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  },
  async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },
  async create({ username, email, password_hash, role = 'Funcionário', status = 'inativo' }) {
    try {
      const [result] = await db.execute('INSERT INTO users (username, email, password_hash, role, status) VALUES (?,?,?,?,?)', [username, email, password_hash, role, status]);
      return result.insertId;
    } catch (err) {
      const [result2] = await db.execute('INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)', [username, email, password_hash, role]);
      const id = result2.insertId;
      try {
        await db.execute('UPDATE users SET updated_at = NOW() WHERE id = ?', [id]);
      } catch {}
      return id;
    }
  },
  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },
  async updatePasswordHash(id, password_hash) {
    const [result] = await db.execute('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [password_hash, id]);
    return result.affectedRows === 1;
  },
  async updateUser(id, { username, email, role }) {
    const [result] = await db.execute('UPDATE users SET username = ?, email = ?, role = ?, updated_at = NOW() WHERE id = ?', [username, email, role, id]);
    return result.affectedRows === 1;
  },
  async deleteUser(id) {
    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows === 1;
  },
  async setStatus(id, status) {
    try {
      const [result] = await db.execute('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
      return result.affectedRows === 1;
    } catch (err) {
      return false;
    }
  },
  async setEmailValidationToken(id, token, expiresAt) {
    try {
      const [result] = await db.execute('UPDATE users SET email_validation_token = ?, email_validation_expires_at = ?, updated_at = NOW() WHERE id = ?', [token, expiresAt, id]);
      return result.affectedRows === 1;
    } catch (err) {
      return false;
    }
  },
  async findByValidationToken(token) {
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE email_validation_token = ?', [token]);
      return rows[0] || null;
    } catch (err) {
      return null;
    }
  },
  async confirmEmailValidation(id) {
    try {
      const [result] = await db.execute('UPDATE users SET email_validated_at = NOW(), status = "ativo", email_validation_token = NULL, email_validation_expires_at = NULL, updated_at = NOW() WHERE id = ?', [id]);
      return result.affectedRows === 1;
    } catch (err) {
      return false;
    }
  }
};

module.exports = UserRepository;
/*
  Repositório de Usuários
  - Operações de persistência para usuários: CRUD, busca por username/email,
    status e tokens de validação.
*/