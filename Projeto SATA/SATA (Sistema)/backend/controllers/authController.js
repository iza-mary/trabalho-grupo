const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repository/userRepository');
const User = require('../models/user');

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ success: false, error: 'username e password são obrigatórios' });
      const user = await UserRepository.findByUsername(username);
      if (!user) return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ success: false, error: 'Credenciais inválidas' });

      const secret = process.env.JWT_SECRET;
      if (!secret) return res.status(500).json({ success: false, error: 'Configuração de JWT ausente' });
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret, { expiresIn: '8h' });
      res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao realizar login', detail: err.message });
    }
  }

  async register(req, res) {
    try {
      const { username, password, role = 'user' } = req.body;
      const user = new User({ username, password, role });
      const errors = user.validate({ forCreate: true });
      if (errors.length) return res.status(400).json({ success: false, error: 'Dados inválidos', details: errors });

      const existing = await UserRepository.findByUsername(username);
      if (existing) return res.status(409).json({ success: false, error: 'username já utilizado' });

      const password_hash = await bcrypt.hash(password, 10);
      const id = await UserRepository.create({ username, password_hash, role });
      res.status(201).json({ success: true, data: { id, username, role } });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao registrar usuário', detail: err.message });
    }
  }
}

module.exports = new AuthController();