class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = (data.username || '').trim();
    this.email = (data.email || '').trim();
    this.password = data.password || null; // plain for validation only
    this.password_hash = data.password_hash || null; // stored
    this.role = data.role || 'Funcionário';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  validate({ forCreate = true } = {}) {
    const errors = [];
    if (!this.username) errors.push('username é obrigatório');
    if (this.email) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
      if (!emailOk) errors.push('email inválido');
    } else {
      errors.push('email é obrigatório');
    }
    if (forCreate) {
      if (!this.password) errors.push('password é obrigatório');
      if (this.password) {
        const { checkPassword } = require('../utils/passwordPolicy');
        const err = checkPassword(this.password);
        if (err) errors.push(err);
      }
    }
    const allowedRoles = ['Admin', 'Funcionário'];
    if (!allowedRoles.includes(this.role)) errors.push('role inválido');
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = User;