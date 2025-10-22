const db = require('../config/database');

const UserRepository = {
  async findByUsername(username) {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  },
  async create({ username, password_hash, role = 'Funcionário' }) {
    const [result] = await db.execute('INSERT INTO users (username, password_hash, role) VALUES (?,?,?)', [username, password_hash, role]);
    return result.insertId;
  },
  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },
  async updatePasswordHash(id, password_hash) {
    const [result] = await db.execute('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [password_hash, id]);
    return result.affectedRows === 1;
  }
};

module.exports = UserRepository;