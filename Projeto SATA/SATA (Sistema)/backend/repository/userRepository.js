const db = require('../config/database');

const UserRepository = {
  async findByUsername(username) {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  },
  async create({ username, password_hash, role = 'user' }) {
    const [result] = await db.execute('INSERT INTO users (username, password_hash, role) VALUES (?,?,?)', [username, password_hash, role]);
    return result.insertId;
  }
};

module.exports = UserRepository;