const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repository/userRepository');
const User = require('../models/user');

const normalizeRole = (role) => {
  if (!role) return 'Funcionário';
  const r = String(role).toLowerCase();
  if (r.includes('admin')) return 'Admin';
  if (r.includes('funcion')) return 'Funcionário';
  if (r.includes('user') || r.includes('usuário') || r.includes('usuario')) return 'Funcionário';
  return 'Funcionário';
};

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Nome do Usuário e senha são obrigatórios' });
      }
      const user = await UserRepository.findByUsername(username);
      if (!user) return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ success: false, error: 'Credenciais inválidas' });

      const role = normalizeRole(user.role);
      const secret = process.env.JWT_SECRET;
      if (!secret) return res.status(500).json({ success: false, error: 'Configuração de JWT ausente' });
      const token = jwt.sign(
        { id: user.id, username: user.username, role },
        secret,
        { expiresIn: '8h' }
      );

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000
      });

      return res.json({ success: true, user: { id: user.id, username: user.username, role } });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao realizar login', detail: err.message });
    }
  }

  async logout(req, res) {
    try {
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao realizar logout', detail: err.message });
    }
  }

  async me(req, res) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Não autenticado' });
      const user = await UserRepository.findById(req.user.id);
      if (!user) {
        res.clearCookie('auth_token');
        return res.status(401).json({ success: false, error: 'Sessão inválida' });
      }
      const role = normalizeRole(user.role);
      return res.json({ success: true, user: { id: user.id, username: user.username, role } });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao obter usuário', detail: err.message });
    }
  }

  async register(req, res) {
    try {
      const { username, password, role: inputRole = 'Funcionário' } = req.body;
      const role = normalizeRole(inputRole);
      const user = new User({ username, password, role });
      const errors = user.validate({ forCreate: true });
      if (errors.length) return res.status(400).json({ success: false, error: 'Dados inválidos', details: errors });

      const existing = await UserRepository.findByUsername(username);
      if (existing) return res.status(409).json({ success: false, error: 'Nome do Usuário já utilizado' });

      const password_hash = await bcrypt.hash(password, 10);
      const id = await UserRepository.create({ username, password_hash, role });
      return res.status(201).json({ success: true, data: { id, username, role } });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao registrar usuário', detail: err.message });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { username } = req.body;
      if (!username) return res.status(400).json({ success: false, error: 'Nome do Usuário é obrigatório' });
      const user = await UserRepository.findByUsername(username);
      if (!user) return res.status(200).json({ success: true }); // evitar enumeração de usuários
      const secret = process.env.JWT_SECRET;
      if (!secret) return res.status(500).json({ success: false, error: 'Configuração de JWT ausente' });
      const token = jwt.sign({ action: 'reset', id: user.id, username: user.username }, secret, { expiresIn: '15m' });
      console.log(`Token de reset para ${user.username}: ${token}`);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao iniciar recuperação de senha', detail: err.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, new_password } = req.body;
      if (!token || !new_password) return res.status(400).json({ success: false, error: 'Token e nova senha são obrigatórios' });
      const secret = process.env.JWT_SECRET;
      if (!secret) return res.status(500).json({ success: false, error: 'Configuração de JWT ausente' });
      let payload;
      try {
        payload = jwt.verify(token, secret);
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Token inválido ou expirado' });
      }
      if (payload.action !== 'reset' || !payload.id) {
        return res.status(400).json({ success: false, error: 'Token inválido' });
      }

      const hash = await bcrypt.hash(new_password, 10);
      const ok = await UserRepository.updatePasswordHash(payload.id, hash);
      if (!ok) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao redefinir senha', detail: err.message });
    }
  }

  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      if (!current_password || !new_password) {
        return res.status(400).json({ success: false, error: 'Senha atual e nova são obrigatórias' });
      }
      const user = await UserRepository.findById(req.user.id);
      if (!user) return res.status(401).json({ success: false, error: 'Não autenticado' });
      const ok = await bcrypt.compare(current_password, user.password_hash);
      if (!ok) return res.status(400).json({ success: false, error: 'Senha atual incorreta' });
      const hash = await bcrypt.hash(new_password, 10);
      const updated = await UserRepository.updatePasswordHash(user.id, hash);
      if (!updated) return res.status(500).json({ success: false, error: 'Não foi possível atualizar a senha' });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao trocar senha', detail: err.message });
    }
  }
}

module.exports = new AuthController();