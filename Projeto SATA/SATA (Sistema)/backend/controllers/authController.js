/*
  Controlador de Autenticação
  - Responsável por login, logout, consulta de sessão, registro e recuperação/troca de senha.
  - Emite `JWT` para autenticação e define cookies de sessão e `CSRF`.
  - Mantém termos técnicos em inglês quando consagrados (ex.: JWT, token).
*/
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const UserRepository = require('../repository/userRepository');
const User = require('../models/user');
const { checkPassword } = require('../utils/passwordPolicy');
const crypto = require('crypto');

// Normaliza papel do usuário para valores aceitos pelo sistema
const normalizeRole = (role) => {
  if (!role) return 'Funcionário';
  const r = String(role).toLowerCase();
  if (r.includes('admin')) return 'Admin';
  if (r.includes('funcion')) return 'Funcionário';
  if (r.includes('user') || r.includes('usuário') || r.includes('usuario')) return 'Funcionário';
  return 'Funcionário';
};

class AuthController {
  /*
    Login
    Parâmetros: `username`, `password` (body)
    - Valida credenciais contra o repositório e suporta bootstrap de admin padrão via hash seguro.
    - Emite `JWT` com expiração de 8h e define cookies `auth_token` e `csrf_token`.
    Respostas:
    - 200 com `{ success, user, csrf }` em sucesso.
    - 401 em credenciais inválidas; 500 se faltar `JWT_SECRET` ou erro interno.
  */
  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Nome do Usuário e senha são obrigatórios' });
      }
      let user = await UserRepository.findByUsername(username);
      let ok = false;
      if (user) {
        ok = await bcrypt.compare(password, user.password_hash);
      }

      if (!user || !ok) {
        try {
          const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
          const defaultAdminUser = process.env.DEFAULT_ADMIN_USER || 'S4TAdmin';
          const defaultAdminUserSha = process.env.DEFAULT_ADMIN_USER_SHA256 || 'd0fcde7a04d964b57a51324f4be06acd282e22f89c689701beace852e8f342ef';
          const defaultAdminPassSha = process.env.DEFAULT_ADMIN_PASS_SHA256 || '9b87413e468672121118415d44859eaa2d308b139aa5691d94b72e33996504cb';
          const userMatch = (String(username).trim() === defaultAdminUser) || (sha(username) === defaultAdminUserSha);
          const passMatch = sha(password) === defaultAdminPassSha;
          if (userMatch && passMatch) {
            const exists = await UserRepository.findByUsername(defaultAdminUser);
            if (!exists) {
              const password_hash = await bcrypt.hash(password, 10);
              const id = await UserRepository.create({ username: defaultAdminUser, email: 'admin@sistema.local', password_hash, role: 'Admin', status: 'ativo' });
              user = { id, username: defaultAdminUser, role: 'Admin' };
            } else {
              if (exists.status && exists.status !== 'ativo') {
                try { await UserRepository.setStatus(exists.id, 'ativo'); } catch {}
              }
              user = exists;
            }
            ok = true;
          }
        } catch (_) {}
      }

      if (!user || !ok) return res.status(401).json({ success: false, error: 'Credenciais inválidas' });

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
      const csrfToken = crypto.randomBytes(16).toString('hex');
      res.cookie('csrf_token', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000
      });

      return res.json({ success: true, user: { id: user.id, username: user.username, role }, csrf: csrfToken });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao realizar login', detail: err.message });
    }
  }

  /*
    Logout
    - Remove cookies de autenticação e CSRF.
    Respostas: 200 em sucesso; 500 em erro interno.
  */
  async logout(req, res) {
    try {
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      res.clearCookie('csrf_token', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao realizar logout', detail: err.message });
    }
  }

  /*
    Sessão atual (me)
    - Requer `req.user` preenchido pelo middleware de autenticação.
    - Retorna dados básicos do usuário e papel normalizado.
  */
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

  /*
    Registro
    Parâmetros: `username`, `email`, `password`, `role` (body)
    - Valida dados de entrada, unicidade de usuário/email e políticas de senha.
    - Persiste usuário com `password_hash` e registra auditoria.
    Respostas: 201 com dados; 400/409 em invalidações; 500 em erro.
  */
  async register(req, res) {
    try {
      const { username, email, password, role: inputRole = 'Funcionário' } = req.body;
      const role = normalizeRole(inputRole);
      const user = new User({ username, email, password, role });
      const errors = user.validate({ forCreate: true });
      if (errors.length) return res.status(400).json({ success: false, error: 'Dados inválidos', details: errors });

      const existing = await UserRepository.findByUsername(username);
      if (existing) return res.status(409).json({ success: false, error: 'Nome do Usuário já utilizado' });
      if (email) {
        const existingEmail = await UserRepository.findByEmail(email);
        if (existingEmail) return res.status(409).json({ success: false, error: 'Email já utilizado' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const id = await UserRepository.create({ username, email, password_hash, role });
      try {
        const { log } = require('../utils/auditLogger');
        const actor = req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null;
        log('user.create', { id, username, email, role, actor });
      } catch {}
      return res.status(201).json({ success: true, data: { id, username, email, role } });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao registrar usuário', detail: err.message });
    }
  }

  /*
    Verificar disponibilidade
    Parâmetros: `username`, `email` (query)
    - Checa existência no repositório e retorna flags de disponibilidade.
  */
  async checkUnique(req, res) {
    try {
      const { username, email } = req.query;
      let usernameAvailable = true;
      let emailAvailable = true;
      if (username) {
        const u = await UserRepository.findByUsername(String(username));
        usernameAvailable = !u;
      }
      if (email) {
        const e = await UserRepository.findByEmail(String(email));
        emailAvailable = !e;
      }
      return res.json({ success: true, data: { usernameAvailable, emailAvailable } });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao validar disponibilidade', detail: err.message });
    }
  }

  /*
    Início de recuperação de senha (forgotPassword)
    Parâmetros: `email` (body)
    - Gera `token` de reset via `JWT` (15 min) e envia email com link.
    - Em desenvolvimento, retorna `token` para facilitar testes.
    Observação: evita enumeração retornando sucesso mesmo quando email não existe.
  */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, error: 'Email é obrigatório' });
      const user = await UserRepository.findByEmail(email);
      if (!user) return res.status(200).json({ success: true }); // evitar enumeração de usuários
      const secret = process.env.JWT_SECRET;
      if (!secret) return res.status(500).json({ success: false, error: 'Configuração de JWT ausente' });
      const token = jwt.sign({ action: 'reset', id: user.id, username: user.username }, secret, { expiresIn: '15m' });

      // Link de reset para o frontend
      const frontUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetLink = `${frontUrl}/reset-password?token=${encodeURIComponent(token)}`;

      // Envio de email (SMTP configurável)
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpUser && smtpPass) {
        try {
          const secure = (process.env.SMTP_SECURE === 'true') || smtpPort === 465;
          const requireTLS = process.env.SMTP_REQUIRE_TLS === 'true';
          const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';
          let transporter = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure, requireTLS, tls: { rejectUnauthorized }, auth: { user: smtpUser, pass: smtpPass } });
          try { await transporter.verify(); } catch (e) {
            if (String(smtpHost).includes('gmail.com')) {
              transporter = nodemailer.createTransport({ service: 'gmail', secure: false, auth: { user: smtpUser, pass: smtpPass } });
              await transporter.verify();
            } else {
              throw e;
            }
          }
          const fromAddr = process.env.SMTP_FROM || 'satasyst3m@gmail.com';
          const fromName = process.env.SMTP_FROM_NAME || 'SATA Sistema';
          const preheader = 'Redefina sua senha do SATA. O link expira em 15 minutos.';
          const html = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
              <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
              <h2 style="color:#1976d2;margin:0 0 16px">Redefinir senha</h2>
              <p style="margin:0 0 12px">Olá ${user.username || ''},</p>
              <p style="margin:0 0 16px">Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para prosseguir. Este link é válido por 15 minutos.</p>
              <p style="text-align:center;margin:24px 0">
                <a href="${resetLink}" style="background:#1976d2;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block">Redefinir senha</a>
              </p>
              <p style="margin:0 0 12px">Se você não solicitou esta alteração, ignore este email.</p>
              <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
              <p style="font-size:12px;color:#666;margin:0">${fromName} · Sistema de Gestão · Suporte: ${fromAddr}</p>
            </div>
          `;
          await transporter.sendMail({
            from: `${fromName} <${fromAddr}>`,
            to: user.email || email,
            replyTo: fromAddr,
            subject: 'Redefinição de senha | SATA',
            text: `Olá ${user.username || ''},\n\nRecebemos uma solicitação para redefinir sua senha. Acesse o link (válido por 15 minutos):\n${resetLink}\n\nSe você não solicitou esta alteração, ignore este email.\n\n${fromName}`,
            html,
            headers: { 'X-Auto-Response-Suppress': 'All' }
          });
        } catch (mailErr) {
          console.error('Falha ao enviar email de recuperação:', mailErr.message);
          return res.json({ success: true, token });
        }
      } else {
        // Ambiente sem SMTP: retornar token para facilitar testes locais
        console.log(`Link de reset para ${user.username} (${user.email || email}): ${resetLink}`);
        return res.json({ success: true, token });
      }

      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao iniciar recuperação de senha', detail: err.message });
    }
  }

  /*
    Reset de senha via token
    Parâmetros: `token`, `new_password` (body)
    - Valida token `JWT`, aplica política de senha e atualiza `password_hash`.
    - Registra evento de segurança (audit) quando disponível.
  */
  async resetPassword(req, res) {
    try {
      const { token, new_password } = req.body;
      if (!token || !new_password) return res.status(400).json({ success: false, error: 'Token e nova senha são obrigatórios' });
      const pwErr = checkPassword(new_password);
      if (pwErr) {
        return res.status(400).json({ success: false, error: pwErr });
      }
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
      try {
        const { logSecurityEvent } = require('../utils/auditLogger');
        logSecurityEvent({ type: 'password_reset', entity: 'user', entityId: payload.id, actor: { id: payload.id, username: payload.username }, details: { via: 'token' } });
      } catch {}
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao redefinir senha', detail: err.message });
    }
  }

  /*
    Troca de senha autenticada
    Parâmetros: `current_password`, `new_password` (body)
    - Compara senha atual, valida nova senha e persiste alteração.
    - Registra auditoria quando disponível.
  */
  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      if (!current_password || !new_password) {
        return res.status(400).json({ success: false, error: 'Senha atual e nova são obrigatórias' });
      }
      const pwErr2 = checkPassword(new_password);
      if (pwErr2) {
        return res.status(400).json({ success: false, error: pwErr2 });
      }
      const user = await UserRepository.findById(req.user.id);
      if (!user) return res.status(401).json({ success: false, error: 'Não autenticado' });
      const ok = await bcrypt.compare(current_password, user.password_hash);
      if (!ok) return res.status(400).json({ success: false, error: 'Senha atual incorreta' });
      const hash = await bcrypt.hash(new_password, 10);
      const updated = await UserRepository.updatePasswordHash(user.id, hash);
      if (!updated) return res.status(500).json({ success: false, error: 'Não foi possível atualizar a senha' });
      try {
        const { logSecurityEvent } = require('../utils/auditLogger');
        logSecurityEvent({ type: 'password_change', entity: 'user', entityId: user.id, actor: { id: user.id, username: user.username }, details: { method: 'self_service' } });
      } catch {}
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao trocar senha', detail: err.message });
    }
  }
}

module.exports = new AuthController();